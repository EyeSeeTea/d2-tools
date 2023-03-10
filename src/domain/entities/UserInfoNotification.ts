export interface UserInfoNotification {
    userInfos: UserInfo[];
    email: { subject: string; body: string };
}

export interface UserInfo {
    username: string;
    password: string;
}
