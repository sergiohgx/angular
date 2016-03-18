import {
  CompileTypeMetadata,
  CompileDirectiveMetadata,
  CompileTemplateMetadata
} from './directive_metadata';
import {isPresent, isBlank, isArray} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {PromiseWrapper} from 'angular2/src/facade/async';

import {XHR} from 'angular2/src/compiler/xhr';
import {UrlResolver} from 'angular2/src/compiler/url_resolver';
import {extractStyleUrls, isStyleUrlResolvable} from './style_url_resolver';
import {Injectable} from 'angular2/src/core/di';
import {ViewEncapsulation} from 'angular2/src/core/metadata/view';
import {AnimationDefinition} from 'angular2/src/animate/worker/animation_definition';
import {StringMapWrapper} from 'angular2/src/facade/collection';

import {AnimationStylesVisitor} from 'angular2/src/animate/worker/animation_styles_visitor';
import {isString, isStringMap} from 'angular2/src/facade/lang';
import {AnimationSequence} from 'angular2/src/animate/worker/animation_sequence';
import {AnimationToken, AnimationTokenType} from 'angular2/src/animate/worker/animation_step';

import {
  HtmlAstVisitor,
  HtmlElementAst,
  HtmlTextAst,
  HtmlAttrAst,
  HtmlAst,
  HtmlCommentAst,
  htmlVisitAll
} from './html_ast';
import {HtmlParser} from './html_parser';

import {preparseElement, PreparsedElement, PreparsedElementType} from './template_preparser';

@Injectable()
export class TemplateNormalizer {
  constructor(private _xhr: XHR, private _urlResolver: UrlResolver,
              private _htmlParser: HtmlParser) {}

  normalizeTemplate(directiveType: CompileTypeMetadata,
                    template: CompileTemplateMetadata): Promise<CompileTemplateMetadata> {
    if (isPresent(template.template)) {
      return PromiseWrapper.resolve(this.normalizeLoadedTemplate(
          directiveType, template, template.template, directiveType.moduleUrl));
    } else if (isPresent(template.templateUrl)) {
      var sourceAbsUrl = this._urlResolver.resolve(directiveType.moduleUrl, template.templateUrl);
      return this._xhr.get(sourceAbsUrl)
          .then(templateContent => this.normalizeLoadedTemplate(directiveType, template,
                                                                templateContent, sourceAbsUrl));
    } else {
      throw new BaseException(`No template specified for component ${directiveType.name}`);
    }
  }

  normalizeLoadedTemplate(directiveType: CompileTypeMetadata, templateMeta: CompileTemplateMetadata,
                          template: string, templateAbsUrl: string): CompileTemplateMetadata {
    var rootNodesAndErrors = this._htmlParser.parse(template, directiveType.name);
    if (rootNodesAndErrors.errors.length > 0) {
      var errorString = rootNodesAndErrors.errors.join('\n');
      throw new BaseException(`Template parse errors:\n${errorString}`);
    }

    var visitor = new TemplatePreparseVisitor();
    htmlVisitAll(visitor, rootNodesAndErrors.rootNodes);
    var allStyles = templateMeta.styles.concat(visitor.styles);

    var allStyleAbsUrls =
        visitor.styleUrls.filter(isStyleUrlResolvable)
            .map(url => this._urlResolver.resolve(templateAbsUrl, url))
            .concat(templateMeta.styleUrls.filter(isStyleUrlResolvable)
                        .map(url => this._urlResolver.resolve(directiveType.moduleUrl, url)));

    var allResolvedStyles = allStyles.map(style => {
      var styleWithImports = extractStyleUrls(this._urlResolver, templateAbsUrl, style);
      styleWithImports.styleUrls.forEach(styleUrl => allStyleAbsUrls.push(styleUrl));
      return styleWithImports.style;
    });

    var animations: AnimationDefinition;
    var animationCssTokens = [];
    var animData = templateMeta.animations;

    var compiledAnimations: {[key: string]: any} = {};
    StringMapWrapper.forEach(templateMeta.animations, (value, name) => {
      var animation: AnimationDefinition;

      if (isPresent(value)) {
        if (isArray(value)) {
          animation = new AnimationSequence(value);
        } else if (value instanceof AnimationDefinition) {
          animation = <AnimationDefinition>value;
        } else {
          // TODO (matsko): make a better animation
          throw new BaseException(`Invalid animation value provided`);
        }

        compiledAnimations[name] = animation;
        animation.getTokens().forEach((token: AnimationToken) => {
          if (token.type == AnimationTokenType.CSS_CLASS || token.type == AnimationTokenType.CSS_KEYFRAME) {
            animationCssTokens.push(token.value);
          }
        });
      }
    });

    var animationStyles: {[key: string]: any} = {};
    if (animationCssTokens.length > 0) {
      var stylesVisitor = new AnimationStylesVisitor(templateMeta.styles[0]);
      animationStyles = stylesVisitor.parse(animationCssTokens);
    }

    var encapsulation = templateMeta.encapsulation;
    if (encapsulation === ViewEncapsulation.Emulated && allResolvedStyles.length === 0 &&
        allStyleAbsUrls.length === 0) {
      encapsulation = ViewEncapsulation.None;
    }

    return new CompileTemplateMetadata({
      encapsulation: encapsulation,
      template: template,
      templateUrl: templateAbsUrl,
      styles: allResolvedStyles,
      styleUrls: allStyleAbsUrls,
      animations: compiledAnimations,
      animationStyles: animationStyles,
      ngContentSelectors: visitor.ngContentSelectors
    });
  }
}

class TemplatePreparseVisitor implements HtmlAstVisitor {
  ngContentSelectors: string[] = [];
  styles: string[] = [];
  styleUrls: string[] = [];
  ngNonBindableStackCount: number = 0;

  visitElement(ast: HtmlElementAst, context: any): any {
    var preparsedElement = preparseElement(ast);
    switch (preparsedElement.type) {
      case PreparsedElementType.NG_CONTENT:
        if (this.ngNonBindableStackCount === 0) {
          this.ngContentSelectors.push(preparsedElement.selectAttr);
        }
        break;
      case PreparsedElementType.STYLE:
        var textContent = '';
        ast.children.forEach(child => {
          if (child instanceof HtmlTextAst) {
            textContent += (<HtmlTextAst>child).value;
          }
        });
        this.styles.push(textContent);
        break;
      case PreparsedElementType.STYLESHEET:
        this.styleUrls.push(preparsedElement.hrefAttr);
        break;
      default:
        // DDC reports this as error. See:
        // https://github.com/dart-lang/dev_compiler/issues/428
        break;
    }
    if (preparsedElement.nonBindable) {
      this.ngNonBindableStackCount++;
    }
    htmlVisitAll(this, ast.children);
    if (preparsedElement.nonBindable) {
      this.ngNonBindableStackCount--;
    }
    return null;
  }
  visitComment(ast: HtmlCommentAst, context: any): any { return null; }
  visitAttr(ast: HtmlAttrAst, context: any): any { return null; }
  visitText(ast: HtmlTextAst, context: any): any { return null; }
}
