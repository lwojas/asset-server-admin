# Raycaster Asset Server

A small, project-scoped asset registry and static asset server for the raycaster runtime and editor.

The asset server deliberately knows **nothing about game entities, maps, components, Phaser, or gameplay semantics**. Its responsibility is to make assets available through a stable, generic contract.

## Responsibilities

The asset server provides:

- Project-scoped asset storage
- Asset registration and metadata
- Static asset delivery
- Asset lookup
- Asset removal
- A complete asset manifest for a project

The asset server does **not**:

- Understand entities or components
- Understand maps
- Decide how an asset is used
- Load assets into Phaser
- Create Phaser sprites or animations
- Validate that an `assetKey` is appropriate for a particular game system
- Process or transform image/audio files
- Select a project through the client UI

The client/application layer is responsible for interpreting the asset contract.

---

# Architecture

```text
                    ┌─────────────────────┐
                    │     Content Server  │
                    │                     │
                    │ maps / entities /   │
                    │ game data           │
                    └──────────┬──────────┘
                               │
                               │
┌───────────────┐              │
│    Editor     │──────────────┼──────────────┐
└───────────────┘              │              │
                               │              │
                         ┌─────▼──────────────▼─────┐
                         │       Asset Server       │
                         │                          │
                         │ registry + static files  │
                         └─────────────┬────────────┘
                                       │
                                       │
                                ┌──────▼──────┐
                                │    Runtime  │
                                │             │
                                │ AssetManager│
                                └──────┬──────┘
                                       │
                                       ▼
                                  Phaser cache
```

The asset server is intentionally a **dumb boundary**.

The client-side `AssetManager` is where asset metadata is interpreted and translated into Phaser loading operations.

---

# Project Model

Assets belong to a project.

A project is identified by a `projectId`.

Example:

```text
raycaster
```

The project is normally supplied through application configuration rather than selected by the user.

Example:

```env
ASSET_SERVER_URL=http://localhost:3001
ASSET_PROJECT=raycaster
```

The asset server does not currently require an explicit project registration step.

Creating the first asset for a project automatically creates the required project storage.

```text
data/
└── projects/
    └── raycaster/
        ├── manifest.json
        └── assets/
```

There is therefore no requirement to manually create:

```text
data/projects/raycaster
```

before using the API.

---

# Asset Contract

Every asset has a generic identity:

```json
{
  "assetKey": "wallTexture",
  "type": "image",
  "location": "/projects/raycaster/assets/textures/wall.png"
}
```

## Required fields

### `assetKey`

A stable application-level identifier.

Example:

```text
wallTexture
```

The asset server treats this as an opaque identifier.

It does not know that `wallTexture` is used as a wall texture.

The same identifier can therefore be consumed by different clients.

The client may use it directly as a Phaser cache key:

```js
game.load.image(asset.assetKey, asset.location);
```

Do not use `spriteKey`.

`assetKey` is intentionally generic because an asset does not necessarily represent a sprite.

---

### `type`

Describes the technical asset type.

Current supported types:

```text
image
spritesheet
audio
```

The type determines which additional metadata may be present.

---

### `location`

The URL/path from which the asset can be retrieved.

Example:

```text
/projects/raycaster/assets/textures/wall.png
```

The asset server owns this location.

Clients should not construct asset URLs from filenames themselves.

Use the returned `location`.

---

# Asset Type Contracts

## Image

An image is a single raster image.

Example:

```json
{
  "assetKey": "wallTexture",
  "type": "image",
  "location": "/projects/raycaster/assets/textures/wall.png"
}
```

### Contract

```text
assetKey    required
type        "image"
location    required
```

No additional metadata is required.

### Phaser mapping

The runtime can interpret this as:

```js
game.load.image(asset.assetKey, asset.location);
```

The asset server does not contain this Phaser-specific knowledge.

---

# Spritesheet

A spritesheet is an image containing regularly sized frames.

Example:

```json
{
  "assetKey": "hudShotgun",
  "type": "spritesheet",
  "location": "/projects/raycaster/assets/hud/item_shotgun.png",
  "frameWidth": 130,
  "frameHeight": 200
}
```

### Contract

```text
assetKey      required
type          "spritesheet"
location      required
frameWidth    required
frameHeight   required
```

`frameWidth` and `frameHeight` are pixel dimensions.

### Phaser mapping

The runtime can interpret this as:

```js
game.load.spritesheet(
  asset.assetKey,
  asset.location,
  asset.frameWidth,
  asset.frameHeight,
);
```

The asset server stores the dimensions because they are required to correctly consume the file as a spritesheet.

The server does not calculate or inspect the frames.

---

# Audio

Audio assets contain sound/music data.

Example:

```json
{
  "assetKey": "sfx_pickup",
  "type": "audio",
  "location": "/projects/raycaster/assets/audio/gui/positive.wav"
}
```

### Contract

```text
assetKey    required
type        "audio"
location    required
```

The asset server does not define:

- volume
- looping
- attenuation
- spatial audio
- sound categories
- playback behaviour

Those are runtime/gameplay concerns.

### Phaser mapping

The runtime can interpret this as:

```js
game.load.audio(asset.assetKey, asset.location);
```

---

# Future Asset Types

Additional asset types can be added without changing the basic asset model.

Potential future examples:

```text
video
font
json
binary
atlas
```

A new type should only introduce metadata that is required to consume that particular file format.

For example, if an atlas requires additional information, that metadata belongs to the atlas asset contract.

Do not add game-specific metadata to the asset server.

---

# Complete Asset Manifest

The project manifest is returned by:

```http
GET /projects/:projectId/assets
```

Example:

```json
{
  "projectId": "raycaster",
  "assets": [
    {
      "assetKey": "wallTexture",
      "type": "image",
      "location": "/projects/raycaster/assets/textures/wall.png"
    },
    {
      "assetKey": "hudShotgun",
      "type": "spritesheet",
      "location": "/projects/raycaster/assets/hud/item_shotgun.png",
      "frameWidth": 130,
      "frameHeight": 200
    },
    {
      "assetKey": "sfx_pickup",
      "type": "audio",
      "location": "/projects/raycaster/assets/audio/gui/positive.wav"
    }
  ]
}
```

The manifest is the primary discovery mechanism for clients.

The editor and runtime should not maintain separate hardcoded asset registries.

---

# API

## Get all assets

```http
GET /projects/:projectId/assets
```

Returns the complete project manifest.

Example:

```http
GET /projects/raycaster/assets
```

---

## Get one asset

```http
GET /projects/:projectId/assets/:assetKey
```

Example:

```http
GET /projects/raycaster/assets/wallTexture
```

Returns:

```json
{
  "assetKey": "wallTexture",
  "type": "image",
  "location": "/projects/raycaster/assets/textures/wall.png"
}
```

Returns `404` if the asset does not exist.

---

## Add an asset

POST /projects/:projectId/assets

The request uses multipart/form-data.

Required fields:

- file
- assetKey
- type
- path

For spritesheets, additionally:

- frameWidth
- frameHeight

Example:

curl \
 -X POST \
 -F "file=@assets/textures/wall.png" \
 -F "assetKey=wallTexture" \
 -F "type=image" \
 -F "path=textures/wall.png" \
 http://lynn2:3002/projects/raycaster/assets

curl \
 -X POST \
 -F "file=@assets/hud/item_shotgun.png" \
 -F "assetKey=hudShotgun" \
 -F "type=spritesheet" \
 -F "path=hud/item_shotgun.png" \
 -F "frameWidth=130" \
 -F "frameHeight=200" \
 http://lynn2:3002/projects/raycaster/assets

## Asset Response

The server returns the registered asset together with file metadata.

{
"assetKey": "wallTexture",
"type": "image",
"location": "/projects/raycaster/assets/textures/wall.png",
"originalFilename": "wall.png",
"size": 187,
"mimeType": "image/png",
"id": "e261549f-b81e-4b5e-b34f-dfd8c10a868f"
}

The following fields are managed by the asset server:

- assetKey
- type
- location
- originalFilename
- size
- mimeType
- id

Clients should use `assetKey`, `type`, and `location` as the primary asset contract.

File metadata such as `size`, `mimeType`, and `originalFilename` is informational.

### Duplicate keys

`assetKey` values are unique within a project.

Adding an existing `assetKey` returns a conflict.

The intended update workflow is:

```text
remove asset
      ↓
add asset
```

This keeps asset replacement behaviour explicit and avoids ambiguous file/cache replacement semantics.

---

## Remove an asset

```http
DELETE /projects/:projectId/assets/:assetKey
```

Example:

```http
DELETE /projects/raycaster/assets/wallTexture
```

The registry entry and associated file are removed.

---

# Static Asset Delivery

Registered files are available from their `location`.

Example:

```text
/projects/raycaster/assets/textures/wall.png
```

The `location` returned in the manifest is the canonical location clients should use.

Clients should not derive URLs such as:

```text
/assets/textures/wall.png
```

from the asset's filename.

Always use:

```js
asset.location;
```

This keeps the storage structure behind the asset-server boundary.

---

# Client Responsibilities

## AssetManager

The runtime/editor should have a small asset-management layer between the application and Phaser.

Conceptually:

```text
Asset Server
     │
     │ manifest
     ▼
AssetManager
     │
     │ interprets type
     ▼
Phaser Loader
     │
     ▼
Phaser Cache
```

The AssetManager should:

1. Know the configured `ASSET_SERVER_URL`
2. Know the configured `ASSET_PROJECT`
3. Fetch the project manifest
4. Resolve assets by `assetKey`
5. Validate required metadata
6. Load assets using the appropriate Phaser loader
7. Optionally cache the manifest/assets locally for development

Example:

```js
const asset = assets.get("wallTexture");

assets.load(asset);
```

The AssetManager can translate:

```json
{
  "assetKey": "wallTexture",
  "type": "image",
  "location": "/projects/raycaster/assets/textures/wall.png"
}
```

into:

```js
game.load.image("wallTexture", asset.location);
```

The asset server should never need to know that this happens.

---

# Entity References

Game data may reference an asset by `assetKey`.

Example:

```json
{
  "type": "pickup",
  "assetKey": "health"
}
```

or:

```json
{
  "type": "enemy",
  "sprite": "enemy1_frame0"
}
```

The asset server does not validate these references.

Validation belongs to the application/content layer.

This separation is intentional:

```text
Asset Server
    "Does asset health exist?"

Content / Runtime
    "Is health a valid asset for this entity?"
```

---

# Naming

Asset keys should be stable and semantic.

Good:

```text
wallTexture
doorTexture
health
keyRed
hudShotgun
sfx_pickup
portal
```

Avoid coupling the key to the physical filename.

For example:

```text
wallTexture
```

is preferable to:

```text
wall_png
```

because the physical file can change without changing references throughout the game.

---

# Storage

The server stores assets by project.

Conceptual structure:

```text
data/
└── projects/
    └── raycaster/
        ├── manifest.json
        └── assets/
            ├── textures/
            │   ├── wall.png
            │   ├── floor.png
            │   └── door.png
            │
            ├── items/
            │   ├── health.png
            │   └── key_red.png
            │
            ├── npc/
            │   ├── cobra0.png
            │   └── cobra1.png
            │
            ├── hud/
            │   └── item_shotgun.png
            │
            └── audio/
                └── gui/
                    └── positive.wav
```

The directory structure is primarily for human organisation.

Applications should use `assetKey` and `location`, rather than relying on directory conventions.

---

# Design Principles

## 1. The server is dumb

The asset server should remain generic.

It should not become a game database.

Avoid adding concepts such as:

```text
enemy
weapon
wall
pickup
player
animation
map
component
```

to the server API.

---

## 2. Asset identity is separate from file identity

The application references:

```text
assetKey
```

The server manages:

```text
location
```

This allows the physical file to change without requiring every consumer to know about the storage layout.

---

## 3. Type metadata describes the file

Metadata such as:

```text
frameWidth
frameHeight
```

belongs in the asset contract because it is required to interpret the file correctly.

Metadata such as:

```text
damage
volume
animationSpeed
enemyType
```

does not belong in the asset contract.

Those belong to application/game data.

---

## 4. Phaser is a consumer

The asset server must remain independent of Phaser.

Phaser-specific loading belongs in the runtime's AssetManager.

This means the same asset server could eventually be consumed by:

- Phaser runtime
- React editor
- admin tooling
- automated build tools
- another runtime

without changing the server contract.

---

## 5. Project is a namespace

The project boundary is:

```text
/project/:projectId/assets
```

A client normally receives its project through configuration.

For example:

```env
ASSET_PROJECT=raycaster
```

There is currently no need for project selection in the UI.

---

# Current Contract Summary

| Type          | Required fields                                             | Phaser operation     |
| ------------- | ----------------------------------------------------------- | -------------------- |
| `image`       | `assetKey`, `type`, `location`                              | `load.image()`       |
| `spritesheet` | `assetKey`, `type`, `location`, `frameWidth`, `frameHeight` | `load.spritesheet()` |
| `audio`       | `assetKey`, `type`, `location`                              | `load.audio()`       |

The generic contract is:

```json
{
  "assetKey": "string",
  "type": "string",
  "location": "string"
}
```

Type-specific fields are added only where required.

---

# Health Check

```http
GET /health
```

Returns a simple server health response.

This endpoint does not depend on a project existing.

---

# Development

Install dependencies:

```bash
npm install
```

Run normally:

```bash
npm start
```

Run with automatic restart during development:

```bash
npm run dev
```

Optional configuration:

```env
DATA_ROOT=./data/projects
PORT=3001
```

---

# Client Migration

When migrating an existing client from hardcoded assets:

### Before

```js
game.load.image("wallTexture", "assets/textures/wall.png");
```

### After

```js
const asset = assets.get("wallTexture");

game.load.image(asset.assetKey, asset.location);
```

For spritesheets:

### Before

```js
game.load.spritesheet("hudShotgun", "assets/hud/item_shotgun.png", 130, 200);
```

### After

```js
const asset = assets.get("hudShotgun");

game.load.spritesheet(
  asset.assetKey,
  asset.location,
  asset.frameWidth,
  asset.frameHeight,
);
```

The important migration is therefore:

```text
hardcoded filename
        ↓
assetKey lookup
        ↓
asset manifest
        ↓
AssetManager
        ↓
Phaser loader
```

The editor should use the same manifest rather than maintaining its own hardcoded `editorAssets` registry.
