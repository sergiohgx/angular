export class CssStylesMediaTuple {
  constructor(public mediaQuery: string,
              public styles: {[key: string]: string}) {

  }
}

export class CssStylesResolver {
  constructor(private _entries: CssStylesMediaTuple[]) { }

  resolve(targetMediaQuery: string): {[key: string]: string} {
    // TODO
    return this._entries[0].styles;
  }
}
