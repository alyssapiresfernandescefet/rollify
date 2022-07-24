import type { AlertColor } from '@mui/material';
import type { AxiosInstance } from 'axios';
import { createContext } from 'react';
import type { AddDataDialogProps } from '../components/sheet/dialogs/AddDataDialog';
import type { SocketIO } from '../hooks/useSocket';
import { api } from '../utils/createApiClient';
import type { DiceRequest, DiceResponse } from '../utils/dice';

export type LoggerContextType = (props: LoggerProps) => void;
export type LoggerProps = {
	severity?: AlertColor;
	text: string;
};

export type AddDataContextType = {
	openDialog: (
		data: { id: number; name: string }[],
		onSubmit: AddDataDialogProps['onSubmit']
	) => void;
	closeDialog: () => void;
};

export type DiceRollEvent = (
	dice: DiceRequest,
	onResult?: (result: DiceResponse[]) => void | DiceResponse[]
) => void;

export const LoggerContext = createContext<LoggerContextType>(() => {});
export const SocketContext = createContext<SocketIO>(undefined as any);
export const ApiContext = createContext<AxiosInstance>(api);
export const AddDataContext = createContext<AddDataContextType>({
	openDialog: () => {},
	closeDialog: () => {},
});
export const DiceRollContext = createContext<DiceRollEvent>(() => {});
