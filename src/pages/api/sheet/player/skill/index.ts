import type { PlayerSkill } from '@prisma/client';
import type { DiceConfig } from '../../../../../utils/dice';
import type { NextApiHandlerIO, NextApiResponseData } from '../../../../../utils/next';
import prisma from '../../../../../utils/prisma';
import { withSessionApi } from '../../../../../utils/session';

export type PlayerSkillApiResponse = NextApiResponseData<
	'unauthorized' | 'invalid_body',
	{
		skill: PlayerSkill & {
			Skill: {
				Specialization: {
					name: string;
				} | null;
				id: number;
				name: string;
			};
		};
	}
>;

const handler: NextApiHandlerIO<PlayerSkillApiResponse> = (req, res) => {
	if (req.method === 'POST') return handlePost(req, res);
	if (req.method === 'PUT') return handlePut(req, res);
	return res.status(405).end();
};

const handlePost: NextApiHandlerIO<PlayerSkillApiResponse> = async (req, res) => {
	const player = req.session.player;
	const npcId = Number(req.body.npcId) || undefined;

	if (!player || (player.admin && !npcId))
		return res.json({ status: 'failure', reason: 'unauthorized' });

	if (!req.body.id) res.json({ status: 'failure', reason: 'invalid_body' });

	const skill_id = Number(req.body.id);
	const player_id = npcId || player.id;

	const value = req.body.value === undefined ? undefined : Number(req.body.value);
	const checked = req.body.checked === undefined ? undefined : Boolean(req.body.checked);
	const modifier = req.body.modifier === undefined ? undefined : Number(req.body.modifier);

	try {
		const skill = await prisma.playerSkill.update({
			where: { player_id_skill_id: { player_id, skill_id } },
			data: { value, checked, modifier },
			include: {
				Skill: { select: { id: true, name: true, Specialization: { select: { name: true } } } },
			},
		});

		res.json({
			status: 'success',
			skill,
		});

		res.socket.server.io.emit(
			'playerSkillChange',
			player_id,
			skill_id,
			skill.value,
			skill.modifier
		);
	} catch (err) {
		console.error(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

const handlePut: NextApiHandlerIO<PlayerSkillApiResponse> = async (req, res) => {
	const player = req.session.player;
	const npcId = Number(req.body.npcId) || undefined;

	if (!player || (player.admin && !npcId))
		return res.json({ status: 'failure', reason: 'unauthorized' });

	if (!req.body.id) res.json({ status: 'failure', reason: 'invalid_body' });

	const skill_id = Number(req.body.id);
	const player_id = npcId || player.id;

	try {
		const [skill, dices] = await prisma.$transaction([
			prisma.skill.findUnique({
				where: { id: skill_id },
				select: { startValue: true },
			}),
			prisma.config.findUnique({
				where: { name: 'dice' },
				select: { value: true },
			}),
		]);

		const playerSkill = await prisma.playerSkill.create({
			data: {
				skill_id,
				player_id,
				value: skill?.startValue || 0,
			},
			include: {
				Skill: { select: { id: true, name: true, Specialization: { select: { name: true } } } },
			},
		});

		const enableModifiers = (JSON.parse(dices?.value || '{}') as DiceConfig).skill.enable_modifiers;
		if (!enableModifiers) playerSkill.modifier = null as any;

		res.json({
			status: 'success',
			skill: playerSkill,
		});
	} catch (err) {
		console.error(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

export default withSessionApi(handler);
