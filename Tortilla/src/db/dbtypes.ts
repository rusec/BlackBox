import { options } from "../modules/util/options";

export type ServerInfo = {
    Name: string;
    "IP Address": string;
    Username: string;
    Password: string;
    "OS Type": options;
    ssh_key: boolean;
    password_changes: number;
    domain:string,
};