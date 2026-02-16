'use client';

import { useUser } from '@/app/context/userContext';
import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export default function OnboardingTour() {
  const { user, tour, handleCompleteTour } = useUser()
  const tourStarted = useRef(false); // track if tour has already started

  function waitForElement(selector: string, timeout = 5000) {
    return new Promise<HTMLElement>((resolve, reject) => {
      const interval = 50;
      let elapsed = 0;
      const check = setInterval(() => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) {
          clearInterval(check);
          resolve(el);
        }
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(check);
          reject(new Error(`Element ${selector} not found`));
        }
      }, interval);
    });
  }

  useEffect(() => {
    const initTour = async () => {
      // Prevent duplicate tours
      if (tour === null) {
        return
      }
      else if (tour) {
        return
      }

      if (tourStarted.current) return;
      tourStarted.current = true;

      try {
        await waitForElement('#connect-telegram-button');

        const tour = new Shepherd.Tour({
          defaultStepOptions: {
            scrollTo: true,
            cancelIcon: { enabled: true },
          },
        });

        // Step 1: Connect Telegram
        tour.addStep({
          id: 'telegram-step',
          title: 'Connect Telegram',
          text: 'Start by connecting Telegram in order to enable other features',
          attachTo: { element: '#connect-telegram-button', on: 'bottom' },
          buttons: [
            {
              text: 'Next',
              action: tour.next,
            },
          ],
        });

        // Step 2: Connect Google Calendar
        tour.addStep({
          id: 'calendar-step',
          title: 'Connect Google Calendar',
          text: 'Connect your Google Calendar to sync events and reminders into your calendar.',
          attachTo: { element: '#connect-calendar-button', on: 'bottom' },
          buttons: [
            {
              text: 'Back',
              action: tour.back,
            },
            {
              text: 'Next',
              action: tour.next,
            },
          ],
        });

        // Step 3: Connect Gmail
        tour.addStep({
          id: 'gmail-step',
          title: 'Connect Gmail',
          text: 'Finally, connect Gmail to send and receive emails to your telegram.',
          attachTo: { element: '#connect-gmail-button', on: 'bottom' },
          buttons: [
            {
              text: 'Back',
              action: tour.back,
            },
            {
              text: 'Finish',
              action: () => {
                tour.complete();
                handleCompleteTour();
              },
            },
          ],
        });

        tour.start();
      } catch (err) {
        console.error(err);
        handleCompleteTour();
      }
    };

    initTour();
  }, [tour]);

  return null;
}
