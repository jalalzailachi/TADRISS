'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  width = 'md',
  footer,
}: SlideOverProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 end-0 flex max-w-full ps-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full rtl:-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-250"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full rtl:-translate-x-full"
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen ${widths[width]}`}
                >
                  <div className="flex h-full flex-col overflow-y-auto bg-surface-container-lowest shadow-2xl border-s border-outline-variant/10">
                    <div className="px-6 py-5 border-b border-outline-variant/10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Dialog.Title className="text-lg font-headline font-bold text-on-surface truncate">
                            {title}
                          </Dialog.Title>
                          {description && (
                            <Dialog.Description className="mt-1 text-sm text-on-surface-variant">
                              {description}
                            </Dialog.Description>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full p-2 text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                          aria-label="Close"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            close
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 px-6 py-6">{children}</div>

                    {footer && (
                      <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/50">
                        {footer}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
