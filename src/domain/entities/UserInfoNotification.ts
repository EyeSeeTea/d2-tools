export interface UserInfoNotification {
    userInfos: UserInfo[];
    email: {
        subject: string;
        body: string;
        attachments?: string[];
    };
}

export interface UserInfo {
    username: string;
    password: string;
}
