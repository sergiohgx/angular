import {Injectable} from 'angular2/src/core/di';
import {ListWrapper} from 'angular2/src/facade/collection';

import * as o from '../output/output_ast';
import {CompileElement} from './compile_element';
import {CompileView} from './compile_view';
import {buildView, ViewCompileDependency} from './view_builder';

import {CompileDirectiveMetadata, CompilePipeMetadata} from '../compile_metadata';

import {TemplateAst} from '../template_ast';
import {CompilerConfig} from '../config';

import {AnimationCompiler} from '../animation_compiler';

export class ViewCompileResult {
  constructor(public statements: o.Statement[], public viewFactoryVar: string,
              public dependencies: ViewCompileDependency[]) {}
}

@Injectable()
export class ViewCompiler {
  private _animationCompiler = new AnimationCompiler();
  constructor(private _genConfig: CompilerConfig) {}

  compileComponent(component: CompileDirectiveMetadata, template: TemplateAst[],
                   styles: o.Expression, animations: o.Expression, pipes: CompilePipeMetadata[]): ViewCompileResult {
    var statements = [];
    var dependencies = [];
    var compiledAnimations = this._animationCompiler.compileComponent(component);
    compiledAnimations.forEach(entry => {
      ListWrapper.addAll(statements, entry.statements);
    });

    var view = new CompileView(component, this._genConfig, pipes, styles, compiledAnimations, 0,
                               CompileElement.createNull(), []);
    buildView(view, template, dependencies, statements);
    return new ViewCompileResult(statements, view.viewFactory.name, dependencies);
  }
}
