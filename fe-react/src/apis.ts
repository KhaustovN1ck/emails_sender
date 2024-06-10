import axios, {AxiosResponse} from 'axios';
import {EmailRecord} from "./types/email-record.ts";

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000'
})


export const submitEmails = (emails: string[]): Promise<AxiosResponse<EmailRecord[]>> => {
    return axiosInstance.post('/mailer/verify', {
        emails,
    });
}

export const resetEmails = () => {
    return axiosInstance.post('/mailer/reset-all')
}

export const getAll = (): Promise<AxiosResponse<EmailRecord[]>> => {
    return axiosInstance.get('/mailer');
}