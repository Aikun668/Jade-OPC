/* eslint-disable */
// uni-app WeChat mini-program specific attributes not covered by @dcloudio/types
// These are needed for vue-tsc to accept them on native elements in templates.

declare namespace JSX {
  interface IntrinsicAttributes {
    /** uni-app textarea: keep keyboard visible after blur */
    'hold-keyboard'?: boolean
    /** uni-app textarea: auto-adjust position when keyboard shows */
    'adjust-position'?: boolean
  }
}
