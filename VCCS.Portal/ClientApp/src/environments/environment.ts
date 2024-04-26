export declare interface Environment {
  production: boolean;
  apiUrl: string;
}

export const environment: Environment = {
	production: false,
	apiUrl: `${window[<any>"env"][<any>"apiUrl"]}`
};
