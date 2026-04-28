import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import Icon from '../../components/Icon';
import { HelpTicket } from '../../types';

const ManageHelpDesk: React.FC = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const [tickets, setTickets] = useState<HelpTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'helpdesk'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as HelpTicket)));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'helpdesk', id), { status: newStatus, updatedAt: Date.now() });
            notify(`Ticket marked as ${newStatus}`, 'success');
            fetchTickets();
        } catch (e) {
            notify("Error updating ticket", 'error');
        }
    };

    const handleSendReply = async (ticket: HelpTicket) => {
        if (!replyText.trim()) return notify("Please enter a reply message.", "error");

        try {
            await updateDoc(doc(db, 'helpdesk', ticket.id), {
                status: 'Replied',
                adminReply: replyText,
                updatedAt: Date.now(),
                viewedByUser: false
            });

            // Send Notification to user
            const notifId = doc(collection(db, 'notifications')).id;
            await setDoc(doc(db, 'notifications', notifId), {
                id: notifId,
                userId: ticket.userId,
                title: "Support Ticket Update",
                message: `Admin replied to your ticket: #${ticket.id.slice(0, 6)}`,
                type: "ticket",
                link: `/ticket/${ticket.id}`,
                isRead: false,
                createdAt: Date.now()
            });

            notify("Reply sent successfully!", "success");
            setReplyingTo(null);
            setReplyText('');
            fetchTickets();
        } catch (e) {
            notify("Failed to send reply", "error");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center space-x-6 mb-12">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                    <Icon name="arrow-left" className="text-xs" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Help Desk</h1>
                    <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Support Tickets</p>
                </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-x-auto text-sm">
                {loading ? (
                    <div className="py-20 text-center"><Icon name="spinner" className="animate-spin text-emerald-500 text-3xl" /></div>
                ) : tickets.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Ticket Details</th>
                                <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">User Contact</th>
                                <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Feedback & View</th>
                                <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-zinc-500">Status</th>
                                <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(t => (
                                <React.Fragment key={t.id}>
                                    <tr className={`border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:bg-zinc-800/50 transition-colors ${replyingTo === t.id ? 'bg-emerald-50/50' : ''}`}>
                                        <td className="p-5 max-w-[250px]">
                                            <div className="font-mono text-xs text-zinc-400 mb-1">#{t.id.slice(0, 6)}</div>
                                            <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1 truncate">{t.subject}</div>
                                            <div className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed whitespace-pre-wrap">{t.message}</div>
                                            {t.adminReply && (
                                                <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                                    <div className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">Your Reply</div>
                                                    <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{t.adminReply}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 align-top">
                                            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">{t.userName || 'Unknown User'}</div>
                                            <div className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-block select-all">{t.userEmail}</div>
                                        </td>
                                        <td className="p-5 align-top">
                                            <div className="flex flex-col space-y-2">
                                                {t.adminReply ? (
                                                    t.viewedByUser ? (
                                                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                                                            <Icon name="eye" className="mr-1.5" /> Viewed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700">
                                                            <Icon name="eye-slash" className="mr-1.5" /> Not Viewed
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[10px] text-zinc-400 italic">No reply yet</span>
                                                )}

                                                {t.feedback && (
                                                    <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded text-[10px] font-bold border ${t.feedback === 'Satisfied' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                        <Icon name={t.feedback === 'Satisfied' ? 'smile' : 'frown'} className="mr-1.5" /> {t.feedback}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5 align-top">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${t.status === 'Open' ? 'bg-orange-100 text-orange-600' : t.status === 'Replied' ? 'bg-blue-100 text-blue-600' : t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                                {t.status || 'Open'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right align-top">
                                            <div className="flex flex-col items-end space-y-2">
                                                <select 
                                                    value={t.status || 'Open'}
                                                    onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                                    className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold p-2.5 rounded-xl cursor-pointer hover:border-zinc-300 focus:outline-none w-32"
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Replied">Replied</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                                
                                                <button 
                                                    onClick={() => { setReplyingTo(replyingTo === t.id ? null : t.id); setReplyText(''); }}
                                                    className={`w-32 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border ${replyingTo === t.id ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800'}`}
                                                >
                                                    {replyingTo === t.id ? 'Cancel' : (t.adminReply ? 'Edit Reply' : 'Reply')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {replyingTo === t.id && (
                                        <tr className="bg-emerald-50/30 border-b border-emerald-100">
                                            <td colSpan={5} className="p-6">
                                                <div className="w-full max-w-4xl">
                                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Write Reply (Send to User)</label>
                                                    <textarea 
                                                        rows={4}
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Write your response to the user here..."
                                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none mb-4"
                                                    />
                                                    <div className="flex justify-end">
                                                        <button 
                                                            onClick={() => handleSendReply(t)}
                                                            className="px-8 py-3 bg-[#06331e] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-zinc-900 transition-all"
                                                        >
                                                            Send Reply 
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-24 text-center text-zinc-400">
                        <Icon name="inbox" className="text-4xl mb-4 text-zinc-300" />
                        <p className="font-bold text-xs uppercase tracking-widest">No active tickets</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageHelpDesk;
