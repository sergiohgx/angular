export class AnimationHelperMap {
  constructor() {

  }

  lookup(diName: string): any {
    var className = diName[0].toUpperCase() + diName.substring(1) + 'AnimationHelper';
    // TODO : DiLookup
  }
}
