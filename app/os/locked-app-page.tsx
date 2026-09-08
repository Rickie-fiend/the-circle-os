"use client";

import { PageLayout } from "./app-session";
import { CreativeButton } from "./button-engine";

/**
 * An App that has not opened yet.
 *
 * Shown rather than hidden, with its key dark. Sai: "Protocol, and Week app
 * will have a cover screen, with the disabled button."
 *
 * Hiding it would be simpler and worse. The shape of the whole thing is the
 * argument for staying: a person on their first day should be able to see that
 * there is a Protocol coming and a Week after it, and know what they are
 * walking toward. So the cover says what the App is for and which day it
 * opens, and the key sits there, dark, waiting.
 *
 * It says the day rather than "locked", because nothing is being withheld — a
 * Protocol on day one would be a commitment made with no evidence behind it,
 * and a Week Page on day one would have no week to show.
 */
export function LockedAppPage({
  className,
  day,
  label,
  opensOn,
  title,
  why,
}: {
  className: string;
  /** The day of the journey he is on, counting day one as one. */
  day: number;
  label: string;
  opensOn: number;
  title: string;
  why: string;
}) {
  const daysAway = Math.max(0, opensOn - day);
  return (
    <PageLayout
      className={className}
      footer={
        <CreativeButton
          className="os-locked-app-key"
          disabled
          sizing="content"
          styleId="default"
          type="button"
        >
          {daysAway === 1 ? "Opens tomorrow" : `Opens on day ${opensOn}`}
        </CreativeButton>
      }
      headerLeft={<p className="os-card-label">{label}</p>}
      theme="dark"
    >
      <div className="os-page-main">
        <h2>{title}</h2>
      </div>
      <div className="os-page-sub">
        <p className="os-locked-app-why">{why}</p>
      </div>
    </PageLayout>
  );
}
