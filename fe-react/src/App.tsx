import React, {useEffect, useState} from 'react';
import {Button, Divider, Input, message, Spin, Table, Tag} from 'antd';
import './App.scss';
import {getAll, resetEmails, submitEmails} from "./apis.ts";
import Layout from "./Layout.tsx";
import SseListener from "./sse-listener.ts";
import {SSEHandler} from "./types/sse-handler.ts";
import {Status} from "./types/status.ts";
import {useEmails} from "./stores/emails.store.ts";
import {EmailRecord} from "./types/email-record.ts";
import dayjs from "dayjs";
import {AxiosError} from "axios";

const {TextArea} = Input;

const App = () => {
    const [emailsInput, setEmailsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [emails, resetEmailsLocally, upsertEmails] = useEmails(state => [state.emails, state.reset, state.upsert]);

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: ['status', 'name'],
            key: 'status',
            render: (status: Status) => {
                if (status === Status.Validating) {
                    return <Spin/>;
                }
                if (status === Status.Valid) {
                    return <Tag color="green">Valid</Tag>;
                }
                if (status === Status.Invalid) {
                    return <Tag color="red">Invalid</Tag>;
                }
            },
        },
        {
            title: 'Updated at',
            dataIndex: 'lastUpdatedAt',
            sorter: (a: EmailRecord, b: EmailRecord) => dayjs(b.lastUpdatedAt).unix() - dayjs(a.lastUpdatedAt).unix(),
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
            key: 'lastUpdatedAt',
        },
    ];

    useEffect(() => {
        getAll()
            .then(res => {
                upsertEmails(res.data)
            })
    }, []);

    useEffect(() => {
        const handler: SSEHandler<MessageEvent<string>> = {
            onError: (msg) => {
                console.error(msg)
            },
            onMessage: (msg) => {
                upsertEmails([JSON.parse(msg.data)]);
            }
        }

        SseListener.subscribe(handler);
        return () => {
            SseListener.unsubscribe(handler);
        }
    }, [])

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const emailList = emailsInput.split('\n').filter(email => email);
            const results = await submitEmails(emailList);

            upsertEmails(results.data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                message.error(err.response?.data?.message ?? err.message)
            } else {
                message.error('unknown error occurred');
            }
        } finally {
            setLoading(false)
        }
    };

    const handleReset = async () => {
        try {
            setLoading(true);
            await resetEmails();
            resetEmailsLocally();
        } finally {
            setLoading(false);
        }
    }


    return (
        <Layout>
            <h1>
                Welcome to email validator.
            </h1>
            <p>
                You can add any number of emails in the left section. All the email that are currently being processed
                will be shown in the right section
            </p>
            <div className="container">

                <div className="section">
                    <h2>
                        Enter emails to validate in the textarea below:
                    </h2>
                    <TextArea
                        rows={10}
                        value={emailsInput}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailsInput(e.target.value)}
                        placeholder="Enter emails from a new line (e.g. mail1@mail.com \n mail2@mail.com). All other variants will be considred invalid"
                    />
                    <Divider/>
                    <Button type="primary" onClick={handleSubmit} loading={loading} disabled={!emailsInput.trim()}>
                        Submit emails
                    </Button>
                    &nbsp;
                    <Button type="primary" danger onClick={handleReset} loading={loading}>
                        Reset all emails
                    </Button>
                </div>
                <div className="divider"/>
                <div className="section">
                    <h2>
                        Emails and their validation statuses:
                    </h2>
                    <Table
                        dataSource={emails}
                        columns={columns}
                        sortDirections={['descend']}
                        rowKey="email"
                        className="status-table"
                        pagination={false}
                    />
                </div>
            </div>
        </Layout>

    )
};

export default App;