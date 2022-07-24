import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { memo, useContext, useRef, useState } from 'react';
import SheetContainer from './Section';
import { ApiContext, LoggerContext, LoggerContextType } from '../../contexts';
import useExtendedState from '../../hooks/useExtendedState';
import type { PlayerApiResponse } from '../../pages/api/sheet/player';
import type { PlayerInfoApiResponse } from '../../pages/api/sheet/player/info';
import type { SxProps, Theme } from '@mui/material';
import { handleDefaultApiResponse } from '../../utils';
import type { AxiosInstance } from 'axios';

type PlayerInfoContainerProps = {
	title: string;
	playerName: string;
	playerNameShow: boolean;
	playerInfo: {
		id: number;
		name: string;
		value: string;
	}[];
	playerSpec: {
		id: number;
		name: string;
		value: string;
	}[];
};

const PlayerInfoContainer: React.FC<PlayerInfoContainerProps> = (props) => {
	const log = useContext(LoggerContext);
	const api = useContext(ApiContext);
	
	return (
		<SheetContainer title={props.title}>
			<PlayerNameField
				value={props.playerName}
				show={props.playerNameShow}
				sx={{ mt: 2 }}
				log={log}
				api={api}
			/>
			<Stack my={2} spacing={3}>
				{props.playerInfo.map((info) => (
					<PlayerInfoField key={info.id} {...info} />
				))}
			</Stack>
			<Divider sx={{ my: 2 }} />
			<Grid container mb={2} spacing={3} justifyContent='center'>
				{props.playerSpec.map((spec) => (
					<Grid item key={spec.id} md={4} xs={6}>
						<PlayerSpecField {...spec} />
					</Grid>
				))}
			</Grid>
		</SheetContainer>
	);
};

type PlayerNameFieldProps = {
	sx?: SxProps<Theme>;
	value: string;
	show: boolean;
	log: LoggerContextType;
	api: AxiosInstance;
};

const PlayerNameField: React.FC<PlayerNameFieldProps> = (props) => {
	const [show, setShow] = useState(props.show);
	const [value, setValue, isClean] = useExtendedState(props.value);
	const inputRef = useRef<HTMLInputElement>(null);

	const onShowChange = () => {
		const newShow = !show;
		setShow(newShow);
		props.api
			.post<PlayerApiResponse>('/sheet/player', {
				showName: newShow,
			})
			.then((res) => handleDefaultApiResponse(res, props.log))
			.catch((err) => props.log({ severity: 'error', text: err.message }));
	};

	const onValueBlur = () => {
		if (isClean()) return;
		props.api
			.post<PlayerApiResponse>('/sheet/player', { name: value })
			.then((res) => handleDefaultApiResponse(res, props.log))
			.catch((err) => props.log({ severity: 'error', text: 'Unknown error: ' + err.message }));
	};

	return (
		<Box sx={props.sx} display='flex' alignItems='end'>
			<IconButton aria-label={show ? 'Hide' : 'Show'} onClick={onShowChange} size='small'>
				{show ? <VisibilityIcon /> : <VisibilityOffIcon />}
			</IconButton>
			<TextField
				sx={{ ml: 1, flex: '1 0' }}
				variant='standard'
				label='Nome'
				autoComplete='off'
				inputRef={inputRef}
				value={value}
				onChange={(ev) => setValue(ev.target.value)}
				onBlur={onValueBlur}
			/>
		</Box>
	);
};

type PlayerInfoFieldProps = {
	id: number;
	name: string;
	value: string;
};

const PlayerInfoField: React.FC<PlayerInfoFieldProps> = (props) => {
	const [value, setValue, isClean] = useExtendedState(props.value);
	const inputRef = useRef<HTMLInputElement>(null);
	const log = useContext(LoggerContext);
	const api = useContext(ApiContext);

	const onValueBlur = () => {
		if (isClean()) return;
		api
			.post<PlayerInfoApiResponse>('/sheet/player/info', {
				id: props.id,
				value,
			})
			.then(({ data }) => {
				if (data.status === 'success') return;

				switch (data.reason) {
					case 'invalid_body':
						return log({ severity: 'error', text: 'Invalid body' });
					case 'unauthorized':
						return log({ severity: 'error', text: 'Unauthorized' });
					default:
						return log({ severity: 'error', text: 'Unknown error: ' + data.reason });
				}
			})
			.catch((err) => log({ severity: 'error', text: 'Unknown error: ' + err.message }));
	};

	return (
		<TextField
			variant='standard'
			label={props.name}
			autoComplete='off'
			inputRef={inputRef}
			value={value}
			onChange={(ev) => setValue(ev.target.value)}
			onBlur={onValueBlur}
		/>
	);
};

type PlayerSpecFieldProps = {
	id: number;
	name: string;
	value: string;
};

const PlayerSpecField: React.FC<PlayerSpecFieldProps> = (props) => {
	const [value, setValue, isClean] = useExtendedState(props.value);
	const log = useContext(LoggerContext);
	const api = useContext(ApiContext);

	const onValueBlur = () => {
		if (isClean()) return;
		api
			.post('/sheet/player/spec', { id: props.id, value })
			.then((res) => handleDefaultApiResponse(res, log))
			.catch((err) => log({ severity: 'error', text: 'Unknown error: ' + err.message }));
	};

	return (
		<TextField
			variant='outlined'
			label={props.name}
			fullWidth
			value={value}
			onChange={(ev) => setValue(ev.target.value)}
			autoComplete='off'
			onBlur={onValueBlur}
		/>
	);
};

export default memo(PlayerInfoContainer, () => true);
