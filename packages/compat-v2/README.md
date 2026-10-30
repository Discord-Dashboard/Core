# @acstane/compat-v2

Run v2 style settings on v3 without a rewrite.

```js
import { fromV2 } from "@acstane/compat-v2"

const { def, adapter } = fromV2(v2Settings)
createDashboard({ client, discord, settings: def, adapter })
```

Your `getActualSet` and `setNew` callbacks keep working, and every v2 form type is mapped to a v3 field.

Part of [@acstane/dashboard](https://github.com/Discord-Dashboard/Core), now in
public beta. Install with `@beta`, for example
`npm install @acstane/compat-v2@beta`.

## License

MIT
