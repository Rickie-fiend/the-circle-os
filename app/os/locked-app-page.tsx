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
 * It names the chapter that opens it rather than saying "locked", because
 * nothing is being withheld: the chapter is the actual dependency, and it can
 * be started from its Quest whenever he wants. Sai: "unlock after completing
 * the set-up chapter ... We can always rerun from the quest."
 */
export function LockedAppPage({
  className,
  label,
  opensAfter,
  title,
  why,
}: {
  className: string;
  label: string;
  /** The chapter that opens it, named so he knows what to go and do. */
  opensAfter: string;
  title: string;
  why: string;
}) {
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
          {opensAfter ? `Opens after “${opensAfter}”` : "Not open yet"}
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
