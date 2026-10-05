import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { useMotionPreference } from './motion/useMotionPreference';

const emptyForm = { name: '', email: '', message: '' };
const inquiryTopics = ['An internship', 'A project', 'Just saying hi'];

export function ContactForm() {
  const key = import.meta.env.VITE_WEB3FORMS_KEY?.trim();
  const reducedMotion = useMotionPreference();
  const [formData, setFormData] = useState(emptyForm);
  const [inquiry, setInquiry] = useState('');
  const [botcheck, setBotcheck] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const successTimer = useRef<number | undefined>(undefined);
  const requestTimer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => {
    window.clearTimeout(successTimer.current);
    window.clearTimeout(requestTimer.current);
    request.current?.abort();
    request.current = null;
  }, []);

  function edit(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (request.current) return;
    window.clearTimeout(successTimer.current);
    setStatus('idle'); setMessage('');
    const { name, value } = event.currentTarget;
    setFormData(previous => ({ ...previous, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    window.clearTimeout(successTimer.current);
    const name = formData.name.trim();
    const email = formData.email.trim();
    const body = formData.message.trim();
    if (!name || !email || !body) {
      setStatus('error'); setMessage('Please add your name, email, and a message (not just spaces).'); return;
    }
    if (!key) {
      setStatus('error'); setMessage('Message sending is not configured yet. Please try again later.'); return;
    }
    const controller = new AbortController();
    request.current = controller;
    setStatus('sending'); setMessage('Sending your message…');
    requestTimer.current = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: key, subject: 'New Portfolio Contact Form Submission', from_name: "Christian's Portfolio", name, email, message: body, inquiry_type: inquiry || 'General inquiry', botcheck }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (request.current !== controller) return;
      if (!response.ok || result?.success !== true) throw new Error('Submission failed');
      setStatus('success'); setMessage('Message sent successfully! I’ll get back to you soon.');
      setFormData(emptyForm); setInquiry(''); setBotcheck(false);
      successTimer.current = window.setTimeout(() => { setStatus('idle'); setMessage(''); }, 3500);
    } catch {
      if (request.current !== controller) return;
      setStatus('error'); setMessage('Your message could not be confirmed as sent. Your text is still here. Please try again later.');
    } finally {
      window.clearTimeout(requestTimer.current);
      if (request.current === controller) request.current = null;
    }
  }

  const buttonStatus = status === 'error' ? 'idle' : status;
  const buttonText = buttonStatus === 'sending' ? 'Sending…' : buttonStatus === 'success' ? 'Sent' : 'Send Message';
  return <form className="contact-form" onSubmit={submit} aria-labelledby="contact-form-title" aria-busy={status === 'sending'}>
    <div className="inquiry-masthead mono"><span>Correspondence / 001</span><span aria-hidden="true">Cebu ↗ Anywhere</span></div>
    <div className="inquiry-heading">
      <h3 id="contact-form-title">A GOOD IDEA<br />STARTS WITH <em>hello.</em></h3>
      <span className="inquiry-stamp" aria-hidden="true"><span>✳</span>Ideas<br />welcome</span>
      <p>An opportunity, a collaboration, a spark of an idea.<br />Tell me what you’re thinking.</p>
    </div>
    <div className="inquiry-rule mono"><span>Your details</span><span>Required fields *</span></div>
    <div className="form-pair">
      <label htmlFor="contact-name"><span className="inquiry-label"><span className="mono" aria-hidden="true">01</span>Your name<span aria-hidden="true">*</span></span><input id="contact-name" name="name" autoComplete="name" placeholder="Alex, for example" required maxLength={100} disabled={status === 'sending'} value={formData.name} onChange={edit} /></label>
      <label htmlFor="contact-email"><span className="inquiry-label"><span className="mono" aria-hidden="true">02</span>Your email<span aria-hidden="true">*</span></span><input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} disabled={status === 'sending'} value={formData.email} onChange={edit} /></label>
    </div>
    <fieldset className="inquiry-topics" disabled={status === 'sending'}>
      <legend><span className="inquiry-label"><span className="mono" aria-hidden="true">03</span>I’m reaching out about… <span className="inquiry-optional">(optional)</span></span></legend>
      <div className="inquiry-topic-options">{inquiryTopics.map(topic => <label className="inquiry-topic" key={topic}>
        <input type="radio" name="inquiry" value={topic} checked={inquiry === topic} onChange={() => {
          if (request.current) return;
          window.clearTimeout(successTimer.current);
          setInquiry(topic); setStatus('idle'); setMessage('');
        }} />
        <span><span className="inquiry-topic-mark" aria-hidden="true">{inquiry === topic ? '↗' : '+'}</span>{topic}</span>
      </label>)}</div>
    </fieldset>
    <label className="inquiry-message" htmlFor="contact-message"><span className="inquiry-label"><span className="mono" aria-hidden="true">04</span>What do you have in mind?<span aria-hidden="true">*</span></span><textarea id="contact-message" name="message" placeholder="The idea. The opportunity. The wonderfully unfinished thought…" aria-describedby="contact-message-hint" rows={4} required maxLength={5000} disabled={status === 'sending'} value={formData.message} onChange={edit} /></label>
    <div className="inquiry-message-meta"><span id="contact-message-hint">A little context goes a long way.</span><span className="mono" aria-hidden="true">{formData.message.length.toLocaleString()} / 5,000</span></div>
    <input type="checkbox" name="botcheck" className="honeypot" tabIndex={-1} aria-hidden="true" checked={botcheck} disabled={status === 'sending'} onChange={event => { if (!request.current) setBotcheck(event.currentTarget.checked); }} />
    <div className="form-actions">
      <button className={`button button-paper${status === 'success' ? ' button-sent' : ''}`} type="submit" disabled={status === 'sending'} aria-label={buttonText}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span className="send-button-content" key={buttonStatus} aria-hidden="true" initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : .1 }}>
            {buttonText}<Icon name={buttonStatus === 'sending' ? 'Spinner' : buttonStatus === 'success' ? 'Check' : 'Email'} />
          </motion.span>
        </AnimatePresence>
        <span className="inquiry-send-arrow" aria-hidden="true">↗</span>
      </button>
    </div>
    <div className="inquiry-signoff mono"><span>A real conversation starts here.</span><span aria-hidden="true">Over to you ↗</span></div>
    <p className={`form-status status-${status}`} role="status" aria-live="polite">{message}</p>
  </form>;
}
