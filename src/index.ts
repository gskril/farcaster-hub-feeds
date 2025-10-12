import { Hono } from "hono";
import { channelFeedHandler, indexHandler, userFeedHandler } from "./routes";

type Bindings = {
	DEFAULT_HUB: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Home page
app.get("/", indexHandler);

// Channel feed routes
app.get("/:feedType/channel", channelFeedHandler);

// User feed routes
app.get("/:feedType/user/:fid", userFeedHandler);

export default app;
