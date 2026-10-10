import { Fragment } from 'react'

/** The user's message: black bubble on the right. @mentions render bold. */
export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex animate-rise justify-end">
      <p className="max-w-[85%] min-w-0 rounded-xl bg-ink px-3 py-2 leading-5.5 font-medium wrap-break-word whitespace-pre-wrap text-white">
        {text.split(/(@\w+)/g).map((part, i) =>
          part.startsWith('@') ? (
            <strong key={i} className="font-semibold">
              {part}
            </strong>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
      </p>
    </div>
  )
}
