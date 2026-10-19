# Third-party components

## Bencho Action node and Upload dropzone

`components/ui/ActionNode.tsx`, `components/ui/UploadDropzone.tsx` and their
scoped `.mind-node` / `.mind-upload` styles in `app/globals.css` are adapted
from the MIT-licensed source supplied by the user: https://bencho.dev/licence.
Relevant original comments and the Action node's corner-path geometry are retained.
The Action node uses real prompt actions and omits the demo's avatars and crew.
The dropzone uses real files and image preparation instead of simulated upload
progress. Both support keyboard interaction and reduced motion. The MIT notice
below applies to these components as well.

## Bencho Image compare

`components/ui/ImageCompare.tsx` and the `.cmp` styles in `app/globals.css`
are adapted from the Bencho Image compare source supplied with this project request.
The original source comments are retained. The supplied source declares the MIT
license; upstream license and attribution: https://bencho.dev/licence.

Changes include configurable images, responsive dimensions, Portuguese labels,
keyboard controls and reduced-motion support. The component requires only React.

MIT License

Copyright (c) 2026 Lorenzo Cabra

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## React Bits GradientASCII

`components/ui/GradientASCII.jsx` and `GradientASCII.css` are adapted from the
React Bits source attached by the owner (https://reactbits.dev/). The landing
uses the light horizon preset, a capped pixel ratio, and pauses during login.
The source includes offscreen/hidden-tab suspension and reduced-motion support.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## React Bits GridMotion

`components/ui/GridMotion.jsx` and `GridMotion.css` are adapted from the React
Bits source supplied by the owner. The React Bits / David Haz license reproduced
above also applies here. Adaptations include effect-based settings synchronization,
hidden-tab suspension, a static reduced-motion path, and image failure handling.

## Flag icons

The five local SVG country flags in `public/flags` come from lipis/flag-icons
(https://github.com/lipis/flag-icons), MIT licensed. The copyright and full
license are included in `public/flags/LICENSE`.
