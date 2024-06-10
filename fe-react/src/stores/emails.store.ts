import {create} from "zustand";
import {EmailRecord} from "../types/email-record.ts";

type EmailsStore = {
    emails: EmailRecord[];
    upsert(emails: EmailRecord[]): void;
    reset(): void;
}

export const useEmails = create<EmailsStore>((set) => ({
    emails: [],
    reset: () => {
        set({
            emails: []
        })
    },
    upsert: (newEmails) => {
        set((state) => {
            const updatedEmails = [...state.emails];

            newEmails.forEach((newEmail) => {
                const index = updatedEmails.findIndex(email => email.id === newEmail.id);
                if (index !== -1) {
                    updatedEmails[index] = {...updatedEmails[index], ...newEmail};
                } else {
                    updatedEmails.push(newEmail);
                }
            });

            return {emails: updatedEmails};
        });
    },
}))