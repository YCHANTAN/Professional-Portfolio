import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './Icon';
import { useMotionPreference } from './motion/useMotionPreference';

const emptyForm = { name: '', email: '', message: '' };

export function ContactForm() {
  const key = import.meta.env.VITE_WEB3FORMS_KEY?.trim();
  const reducedMotion = useMotionPreference();
  const [formData, setFormData] = useState(emptyForm);
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
        body: JSON.stringify({ access_key: key, subject: 'New Portfolio Contact Form Submission', from_name: "Christian's Portfolio", name, email, message: body, botcheck }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (request.current !== controller) return;
      if (!response.ok || result?.success !== true) throw new Error('Submission failed');
      setStatus('success'); setMessage('Message sent successfully! I’ll get back to you soon.');
      setFormData(emptyForm); setBotcheck(false);
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
  return <form className="contact-form" onSubmit={submit} aria-busy={status === 'sending'}>
    <h3>A good conversation starts here.</h3><p>Send a note directly to my inbox.</p>
    <div className="form-pair">
      <label htmlFor="contact-name">Your name<input id="contact-name" name="name" autoComplete="name" placeholder="Alex, for example" required maxLength={100} disabled={status === 'sending'} value={formData.name} onChange={edit} /></label>
      <label htmlFor="contact-email">Your email<input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} disabled={status === 'sending'} value={formData.email} onChange={edit} /></label>
    </div>
    <label htmlFor="contact-message">What do you have in mind?<textarea id="contact-message" name="message" placeholder="An internship opportunity, a project, or just a hello…" rows={4} required maxLength={5000} disabled={status === 'sending'} value={formData.message} onChange={edit} /></label>
    <input type="checkbox" name="botcheck" className="honeypot" tabIndex={-1} aria-hidden="true" checked={botcheck} disabled={status === 'sending'} onChange={event => { if (!request.current) setBotcheck(event.currentTarget.checked); }} />
    <div className="form-actions">
      <button className={`button button-paper${status === 'success' ? ' button-sent' : ''}`} type="submit" disabled={status === 'sending'} aria-label={buttonText}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span className="send-button-content" key={buttonStatus} aria-hidden="true" initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: reducedMotion ? 0 : .1 }}>
            {buttonText}<Icon name={buttonStatus === 'sending' ? 'Spinner' : buttonStatus === 'success' ? 'Check' : 'Email'} />
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
    <p className={`form-status status-${status}`} role="status" aria-live="polite">{message}</p>
  </form>;
}
