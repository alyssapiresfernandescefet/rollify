import type { NextApiHandler } from 'next';
import type { DiceConfig } from '../../utils/dice';
import type { NextApiResponseData } from '../../utils/next';
import type { Presets } from '../../utils/presets';
import prisma from '../../utils/prisma';

export type BootResponse = NextApiResponseData<
	'already_booted' | 'invalid_preset_id' | 'invalid_locale'
>;

const handler: NextApiHandler<BootResponse> = async (req, res) => {
	if (req.method !== 'POST') return res.status(405).end();

	const config = await prisma.config.findUnique({ where: { name: 'init' } });

	if (config && config.value === 'true')
		return res.json({ status: 'failure', reason: 'already_booted' });

	const locale = String(req.body.locale) || 'en';

	const presets = (await import(`../../utils/presets/${locale}.json`).then(
		(mod) => mod.default
	)) as Presets | undefined;

	if (!presets) return res.json({ status: 'failure', reason: 'invalid_locale' });

	const presetId = req.body.presetId || presets[0].preset_id;

	const preset = presets?.find((p) => p.preset_id === presetId);

	if (!preset) return res.json({ status: 'failure', reason: 'invalid_preset_id' });

	try {
		await prisma.$transaction([
			prisma.config.createMany({ data: getDefaultConfig() }),
			prisma.info.createMany({ data: preset.info }),
			prisma.extraInfo.createMany({ data: preset.extraInfo }),
			prisma.attribute.createMany({ data: preset.attribute }),
			prisma.spec.createMany({ data: preset.spec }),
			prisma.characteristic.createMany({ data: preset.characteristic }),
			prisma.currency.createMany({ data: preset.currency }),
			prisma.specialization.createMany({ data: preset.specialization }),
			prisma.equipment.createMany({ data: preset.equipment }),
			prisma.item.createMany({ data: preset.item }),
			prisma.spell.createMany({ data: preset.spell }),
		]);

		await prisma.$transaction([
			prisma.attributeStatus.createMany({ data: preset.attribute_status }),
			prisma.skill.createMany({ data: preset.skill }),
		]);

		res.json({ status: 'success' });
	} catch (err) {
		console.error(err);
		res.json({ status: 'failure', reason: 'unknown_error' });
	}
};

function getDefaultConfig() {
	return [
		{
			id: 1,
			name: 'init',
			value: 'true',
		},
		{
			id: 2,
			name: 'environment',
			value: 'idle',
		},
		{
			id: 3,
			name: 'admin_key',
			value: '123456',
		},
		{
			id: 4,
			name: 'enable_success_types',
			value: 'false',
		},
		{
			id: 5,
			name: 'portrait_font',
			value: 'null',
		},
		{
			id: 7,
			name: 'dice',
			value: JSON.stringify({
				characteristic: {
					value: 20,
					branched: false,
					enable_modifiers: false,
				},
				skill: {
					value: 20,
					branched: false,
					enable_modifiers: false,
					enable_automatic_markers: false,
				},
				attribute: {
					value: 100,
					branched: false,
				},
			} as DiceConfig),
		},
	];
}

export default handler;
