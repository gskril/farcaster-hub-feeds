import { router, corsify } from './router';

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		return router.handle(request, env).then(corsify);
	},
};
