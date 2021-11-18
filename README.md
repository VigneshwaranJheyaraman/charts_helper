# Charts-Helper

## _npm package to implement Charting frameworks like Chart-IQ and Trading-View at ease_

## Charts Helper is a npm package, that allows developers to implement Finsemble Chart's frameworks like Chart-IQ and Trading-View at ease.

- It provides API to handle API Request to external Data source using HTTP REST API's
- It simplifies the process of updating real time broadcast candle on charts by providing simple functions and abstracting all the logic to provide proper data without missing candle feeds
- It's structured in a way, it supports both [Javascript](https://developer.mozilla.org/en-US/docs/Web/API) and [Typescript](https://www.typescriptlang.org/)
- This supports both Trading-View and Chart-IQ implementation regardless of their strategies

## Docs

- Docs is provided along with the [repository], within the docs folder Kindly check.

## Utils

- Chart's helper also provides exclusive configuration files support for bundling the application, which can be accessed from the _config_ folder

- ### Webpack configuration

  - #### Chart-IQ & Trading-View
    - Webpack configuration which implements _contentHash_ for cache refresh on client's end
    - Chunking of files implemented for better serving over the network
    - Polyfill's added for, Kindly include these line inside a new file called _*polyfill.js*_ within your source directory
    ```js
    import "core-js/stable";
    import "regenerator-runtime/runtime";
    import "whatwg-fetch";
    ```
    - Loaders and Plugins preemptively described for basic configuration
    - Check the docs for more details
  - #### Chart-IQ

    - Chart-IQ's file related configuration provided
    - Folder structure
      - src
        - js => Contains all Javascript files
          - feeds => Contains all feed related files
          - markets => Contains all market related files
          - thridparty => Contains all thridparty files
          - \*.js => regular js files
        - css
          - _.scss / _.css
        - index.html => Basic html which will contain all imports of css and scripts with title
        - app.js => Main js file which will contain all imports and chart engine creation
        - polyfill.js => Polyfill implementation
        - advanced-ciq-template.html => cq-context's template

  - #### Trading-view
    - Trading-View's charting_library related configuration provided
    - Folder structure
      - src
        - charting_library => Trading view's full folder
        - charts => Folder which will contain our chart's implementation
          - feeds => Feed related implementation for data
          - market => Market related implementation like rules sessions etc.,
          - utils => All utilities implementation
          - _.ts or _.js => Typescript or Javascript files
        - css
          - _.scss / _.css
        - index.html => Basic html which will contain all imports of css and scripts with title
        - app.js => Main js file which will contain all imports and Trading view widget creation
        - polyfill.js => Polyfill implementation

## Rollout plans

- Upcoming releases will also provide support for CDN, which can be access by a minified _js file_

## Author

- [Vigneshwaran.J](mailto:vigneshwaran.j@marketsimplified.com)
