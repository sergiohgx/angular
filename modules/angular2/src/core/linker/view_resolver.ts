import {Injectable} from 'angular2/src/core/di';
import {ViewMetadata} from '../metadata/view';
import {ComponentMetadata} from '../metadata/directives';

import {Type, stringify, isBlank, isPresent} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {Map} from 'angular2/src/facade/collection';

import {reflector} from 'angular2/src/core/reflection/reflection';


/**
 * Resolves types to {@link ViewMetadata}.
 */
@Injectable()
export class ViewResolver {
  /** @internal */
  _cache = new Map<Type, ViewMetadata>();

  resolve(component: Type): ViewMetadata {
    var view = this._cache.get(component);

    if (isBlank(view)) {
      view = this._resolve(component);
      this._cache.set(component, view);
    }

    return view;
  }

  /** @internal */
  _resolve(component: Type): ViewMetadata {
    var compMeta: ComponentMetadata;
    var viewMeta: ViewMetadata;

    reflector.annotations(component).forEach(m => {
      if (m instanceof ViewMetadata) {
        viewMeta = m;
      }
      if (m instanceof ComponentMetadata) {
        compMeta = m;
      }
    });

    if (isPresent(compMeta)) {
      if (isBlank(compMeta.template) && isBlank(compMeta.templateUrl) && isBlank(viewMeta)) {
        throw new BaseException(
            `Component '${stringify(component)}' must have either 'template', 'templateUrl', or '@View' set.`);

      } else if (isPresent(compMeta.template) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("template", component);

      } else if (isPresent(compMeta.templateUrl) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("templateUrl", component);

      } else if (isPresent(compMeta.directives) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("directives", component);

      } else if (isPresent(compMeta.pipes) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("pipes", component);

      } else if (isPresent(compMeta.encapsulation) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("encapsulation", component);

      } else if (isPresent(compMeta.styles) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("styles", component);

      } else if (isPresent(compMeta.styleUrls) && isPresent(viewMeta)) {
        this._throwMixingViewAndComponent("styleUrls", component);

      } else if (isPresent(viewMeta)) {
        return viewMeta;

      } else {
        return new ViewMetadata({
          templateUrl: compMeta.templateUrl,
          template: compMeta.template,
          directives: compMeta.directives,
          pipes: compMeta.pipes,
          encapsulation: compMeta.encapsulation,
          styles: compMeta.styles,
          styleUrls: compMeta.styleUrls,
          animations: compMeta.animations,
          animationStyles: compMeta.animationStyles
        });
      }
    } else {
      if (isBlank(viewMeta)) {
        throw new BaseException(`No View decorator found on component '${stringify(component)}'`);
      } else {
        return viewMeta;
      }
    }
    return null;
  }

  /** @internal */
  _throwMixingViewAndComponent(propertyName: string, component: Type): void {
    throw new BaseException(
        `Component '${stringify(component)}' cannot have both '${propertyName}' and '@View' set at the same time"`);
  }
}
