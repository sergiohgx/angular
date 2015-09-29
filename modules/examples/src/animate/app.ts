@Component({
  selector: 'my-application'
})
@View({
  animations: 'my-animations'
})

// animations.ts
AnimationRegistry.register('my-animations', (ctx) => {
  // animation code
})
