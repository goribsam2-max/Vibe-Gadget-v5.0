import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { HelpTicket } from '../types';
import { useNotify } from '../components/Notifications';
import Icon from '../components/Icon';

const TicketDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const notify = useNotify();
    const [ticket, setTicket] = useState<HelpTicket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTicket = async () => {
            if (!id || !auth.currentUser) return;
            try {
                const snap = await getDoc(doc(db, 'helpdesk', id));
                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as HelpTicket;
                    setTicket(data);
                    
                    // Mark as viewed
                    if (!data.viewedByUser && data.adminReply) {
                        await updateDoc(doc(db, 'helpdesk', id), { viewedByUser: true });
                    }
                } else {
                    notify("Ticket not found", "error");
                    navigate('/help-center');
                }
            } catch (err) {
                console.error(err);
                notify("Error loading ticket", "error");
            }
            setLoading(false);
        };
        fetchTicket();
    }, [id, navigate, notify]);

    const handleFeedback = async (feedback: 'Satisfied' | 'Not Satisfied') => {
        if (!ticket) return;
        try {
            await updateDoc(doc(db, 'helpdesk', ticket.id), { feedback, updatedAt: Date.now() });
            setTicket({ ...ticket, feedback });
            notify("Thank you for your feedback!", "success");
        } catch (e) {
            notify("Error submitting feedback", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/30">
                <Icon name="spinner" className="animate-spin text-emerald-500 text-3xl" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
            <div className="flex items-center space-x-6 mb-10">
                <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                    <Icon name="arrow-left" className="text-xs" />
                </button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#06331e] mb-1">Ticket Details</h1>
                    <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">#{ticket.id.slice(0, 8)}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* User Original Request */}
                <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">{ticket.subject}</h3>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{new Date(ticket.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${ticket.status === 'Open' ? 'bg-orange-100 text-orange-600' : ticket.status === 'Replied' ? 'bg-blue-100 text-blue-600' : ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-600 dark:text-zinc-400'}`}>
                            {ticket.status}
                        </span>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                        {ticket.message}
                    </div>
                </div>

                {/* Admin Reply */}
                {ticket.adminReply ? (
                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Icon name="headset" className="text-emerald-600 text-sm" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight text-emerald-900">Support Team</h3>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70">
                                    {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'Recently'}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-emerald-900/80 leading-relaxed font-medium whitespace-pre-wrap mb-6">
                            {ticket.adminReply}
                        </div>

                        {/* Feedback Section */}
                        <div className="border-t border-emerald-200/50 pt-5">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-3 text-center">HOW WAS OUR SUPPORT?</h4>
                            
                            {ticket.feedback ? (
                                <div className="text-center bg-zinc-50 dark:bg-zinc-800 py-3 rounded-xl border border-emerald-100">
                                    <span className="text-xs font-bold text-emerald-700">
                                        You marked this as: <Icon name={ticket.feedback === 'Satisfied' ? 'smile' : 'frown'} className="ml-1 mr-1" /> {ticket.feedback}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex gap-3 justify-center">
                                    <button 
                                        onClick={() => handleFeedback('Satisfied')}
                                        className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center"
                                    >
                                        <Icon name="smile" className="text-sm mr-2" /> Satisfied
                                    </button>
                                    <button 
                                        onClick={() => handleFeedback('Not Satisfied')}
                                        className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center"
                                    >
                                        <Icon name="frown" className="text-sm mr-2" /> Not Satisfied
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 border-dashed">
                        <Icon name="hourglass-half" className="text-2xl text-zinc-300 mb-3" />
                        <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Please Wait</p>
                        <p className="text-[10px] mt-1 text-zinc-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                            Our support team is reviewing your ticket and will reply here soon.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDetails;
