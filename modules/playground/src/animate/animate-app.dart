import 'package:angular2/core.dart' show Component;
import 'package:angular2/animate.dart' show AnimationStepMetadata, AnimationSequenceMetadata;

@Component(
  selector: 'animate-app',
  styleUrls: const ['css/animate-app.css'],
  animations: const {
    "ngEnter": const AnimationSequenceMetadata(const [
      const AnimationStepMetadata(const [
        const { 'height': 0, 'opacity': 0 }
      ], '0'),

      const AnimationStepMetadata(const [
        const { 'background': 'white' }
      ], '0'),

      const AnimationStepMetadata(const [
        const { 'background': 'red', 'height': 100, 'opacity':1 }
      ], '0.5s')
    ])
  }
)
class AnimateApp {
  bool _visible = false;
  var items = [];

  set visible(bool) {
    this._visible = bool;
    if (this._visible) {
      this.items = [
        1,2,3,4,5,
        6,7,8,9,10,
        11,12,13,14,15,
        16,17,18,19,20
      ];
    } else {
      this.items = [];
    }
  }
}
