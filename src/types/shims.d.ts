// Detailed shims for some native/expo modules used in this project.

declare module 'expo-location' {
	export namespace Location {
		export type LocationObject = {
			coords: {
				latitude: number;
				longitude: number;
				accuracy?: number;
				altitude?: number | null;
				heading?: number | null;
				speed?: number | null;
			};
			timestamp: number;
		};

		export type LocationRegion = {
			identifier: string;
			latitude: number;
			longitude: number;
			radius: number;
			notifyOnEnter?: boolean;
			notifyOnExit?: boolean;
		};

		export enum GeofencingEventType {
			Enter = 'ENTER',
			Exit = 'EXIT',
		}

		export const Accuracy: {
			High: number;
			Balanced: number;
			Low: number;
			// fallback
			[key: string]: number | undefined;
		};

		export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
		export function requestBackgroundPermissionsAsync(): Promise<{ status: string }>;
		export function getCurrentPositionAsync(options?: any): Promise<LocationObject>;
		export function startGeofencingAsync(taskName: string, regions: LocationRegion[]): Promise<void>;
		export function stopGeofencingAsync(taskName: string): Promise<void>;
	}

	export = Location;
}

declare module 'expo-task-manager' {
	export interface TaskManagerTaskBody<T = any> {
		data?: T;
		error?: any;
	}

	export function isTaskDefined(taskName: string): boolean;
	export function defineTask(taskName: string, callback: (body: TaskManagerTaskBody<any>) => void): void;
	export = TaskManager;
}

declare module '@react-native-community/netinfo' {
	export type NetInfoState = {
		isConnected?: boolean | null;
		isInternetReachable?: boolean | null;
		type?: string;
	};

	export function fetch(): Promise<NetInfoState>;
	export function addEventListener(callback: (state: NetInfoState) => void): () => void;
	const NetInfo: {
		fetch: typeof fetch;
		addEventListener: typeof addEventListener;
	};
	export default NetInfo;
}

// If any other third-party module causes TS errors, add it here as a temporary shim.

// Shim for react-native-config which is commonly used to provide env vars in RN apps
declare module 'react-native-config' {
	const Config: { [key: string]: string | undefined };
	export default Config;
}

