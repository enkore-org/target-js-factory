# @enkore/target-js-factory



### Special Notes on the embeds API

Embeds are files that (as the name suggests) embedded in the final product.

Embeds can be "viewed" through different protocols.

For example, a `.mts` file might be retrived _as is_ (`text://`) or with its types stripped (`js://`).

List of supported protocols:


|Protocol|Description|Supported Extensions|
|:---|:---|---:|
|`text://`|Retrieve file as is.|All|
|`js://`|Retrieve file as javascript code.|`.mts`|
|`dts://`|Retrieve file as typescript declaration code.|`.mts`|
|`js-bundle://`|Retrieve file as javascript bundle.|`.mts`|

Embeds can also be requested as an "URL" instead of a value.

In a browser environment, this will return a blob and in a node environment a path to a temporary file that gets removed once the main process ends.

#### Hoisting of embeds

Because embeds can be requested as URLs, this leaves us with essentially two ways to implement this: create the resource when requested, or create all resources needed upfront.

The latter approach is more safe in the sense, if a system is out of file storage (or something else is wrong with the temporary file storage system) this will be caught before the application has a chance to initialize.

In order to facilitate hoisting of embeds, embed URLs first must be translated form a local URL to a global embed identifier.

The global embed identifier is a SHA256 hash hex string from the input: `${projectId}/${embedPath}`.

Where the `projectId` is also a SHA256 hash hex string of the package name + version.

The translation from local path to global embed identifier is also embedded inside the final product.

This allows the running environment to not have a SHA256 hashing algorithm (e.g. `window.crypto.sublte` is only available in secure contexts.)

The hoisting of embeds has two runtime side-effects:

1. A property on `globalThis` that stores all embeds, accessible via the global embed identifier.
2. A function that "initializes" the global embed map; this is to make them read-only.
