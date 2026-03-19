import { CoreClient, type CoreFeatures } from "./core/client.ts";
import { type CombinePluginFeatures } from "./core/plugins.ts";
import plugins from "./plugins/mod.ts";

type ClientFeatures = CoreFeatures & CombinePluginFeatures<typeof plugins>;

/** All merged client options from core and plugins. */
export type Options = ClientFeatures["options"];
/** All merged client state from core and plugins. */
export type States = ClientFeatures["state"];
/** All merged client commands from plugins (e.g. `join`, `privmsg`). */
export type Commands = ClientFeatures["commands"];
/** All merged client events from core and plugins. */
export type Events = ClientFeatures["events"];
/** All merged client utilities from plugins. */
export type Utils = ClientFeatures["utils"];

/** Configuration options accepted by the {@link Client} constructor. */
export interface ClientOptions extends Options {}
/** Runtime state exposed via `client.state`. */
export interface ClientState extends States {}
/** Utility helpers exposed via `client.utils`. */
export interface ClientUtils extends Utils {}

/** Full-featured IRC client combining core connection handling with all built-in plugins. */
export interface Client extends Commands {
  readonly state: Readonly<ClientState>;
  readonly utils: Readonly<ClientUtils>;
}

/** Full-featured IRC client combining core connection handling with all built-in plugins. */
export class Client extends CoreClient<Events> {
  constructor(options: ClientOptions) {
    super(plugins, options);
  }
}
