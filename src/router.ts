import { Router, createCors } from 'itty-router';

import handleChannel from './handlers/channel';
import handleUser from './handlers/user';

export const { corsify, preflight } = createCors();
export const router = Router();

// Preflight all requests
router.all('*', preflight);

// List endpoints
// TODO: Make this a simple html page
router.get('/', () => {
	return Response.json({
		endpoints: {
			'/:feedType/user:': '',
			'/:feedType/channel': '',
		},
	});
});

router
	.get('/:type/user', (req, env) => handleUser(req, env))
	.get('/:type/channel', (req, env) => handleChannel(req, env))
	.all('*', () => new Response('Not Found.', { status: 404 }));
