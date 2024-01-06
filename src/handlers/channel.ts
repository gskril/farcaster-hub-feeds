import { IRequest } from 'itty-router';

export default function handler(req: IRequest, env: Env) {
	return new Response('Hello, world!', {
		headers: {
			'content-type': 'text/plain',
		},
	});
}
