import type { Spell } from '@prisma/client';
import type { NextApiHandlerIO, NextApiResponseData } from '../../../utils/next';
import prisma from '../../../utils/prisma';
import { withSessionApi } from '../../../utils/session';

export type SpellSheetApiResponse = NextApiResponseData<
	'unauthorized' | 'invalid_body',
	{ spell: Spell }
>;

const handler: NextApiHandlerIO = (req, res) => {
	if (req.method === 'POST') return handlePost(req, res);
	if (req.method === 'PUT') return handlePut(req, res);
	if (req.method === 'DELETE') return handleDelete(req, res);
	res.status(405).end();
};

const handlePost: NextApiHandlerIO<SpellSheetApiResponse> = async (req, res) => {
	const player = req.session.player;

	if (!player || !player.admin) return res.json({ status: 'failure', reason: 'unauthorized' });

	if (
		!req.body.id ||
		!req.body.name ||
		!req.body.damage ||
		!req.body.description ||
		!req.body.cost ||
		!req.body.type ||
		!req.body.target ||
		!req.body.castingTime ||
		!req.body.range ||
		!req.body.duration ||
		req.body.slots === undefined ||
		req.body.visible === undefined
	) {
		return res.json({
			status: 'failure',
			reason: 'invalid_body',
		});
	}

	const id = Number(req.body.id);
	const name = String(req.body.name);
	const damage = String(req.body.damage);
	const description = String(req.body.description);
	const cost = String(req.body.cost);
	const type = String(req.body.type);
	const target = String(req.body.target);
	const castingTime = String(req.body.castingTime);
	const range = String(req.body.range);
	const duration = String(req.body.duration);
	const slots = Number(req.body.slots);
	const visible = Boolean(req.body.visible);

	try {
		const spell = await prisma.spell.update({
			where: { id },
			data: {
				name,
				damage,
				description,
				cost,
				type,
				target,
				castingTime,
				range,
				duration,
				slots,
				visible,
			},
		});

		res.json({ status: 'success', spell });

		res.socket.server.io.emit('spellChange', spell);
	} catch (err) {
		console.error(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

const handlePut: NextApiHandlerIO<SpellSheetApiResponse> = async (req, res) => {
	const player = req.session.player;

	if (!player || !player.admin) return res.json({ status: 'failure', reason: 'unauthorized' });

	if (
		!req.body.name ||
		!req.body.damage ||
		!req.body.description ||
		!req.body.cost ||
		!req.body.type ||
		!req.body.target ||
		!req.body.castingTime ||
		!req.body.range ||
		!req.body.duration ||
		req.body.slots === undefined ||
		req.body.visible === undefined
	) {
		return res.json({
			status: 'failure',
			reason: 'invalid_body',
		});
	}

	const name = String(req.body.name);
	const damage = String(req.body.damage);
	const description = String(req.body.description);
	const cost = String(req.body.cost);
	const type = String(req.body.type);
	const target = String(req.body.target);
	const castingTime = String(req.body.castingTime);
	const range = String(req.body.range);
	const duration = String(req.body.duration);
	const slots = Number(req.body.slots);
	const visible = Boolean(req.body.visible);

	try {
		const spell = await prisma.spell.create({
			data: {
				name,
				damage,
				description,
				cost,
				type,
				target,
				castingTime,
				range,
				duration,
				slots,
				visible,
			},
		});

		res.json({ status: 'success', spell });

		res.socket.server.io.emit('spellAdd', spell.id, spell.name);
	} catch (err) {
		console.error(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

const handleDelete: NextApiHandlerIO<SpellSheetApiResponse> = async (req, res) => {
	const player = req.session.player;

	if (!player || !player.admin) return res.json({ status: 'failure', reason: 'unauthorized' });

	if (!req.body.id)
		return res.json({
			status: 'failure',
			reason: 'invalid_body',
		});

	const id = Number(req.body.id);

	try {
		const spell = await prisma.spell.delete({ where: { id } });
		res.json({ status: 'success', spell });
		res.socket.server.io.emit('spellRemove', id);
	} catch (err) {
		console.log(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

export default withSessionApi(handler);
