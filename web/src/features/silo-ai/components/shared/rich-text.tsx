import { Fragment, type ReactNode } from 'react'

/** Renders **bold** spans; blank lines become paragraphs. `trailing` is appended to the last paragraph (e.g. a caret). */
export function RichText({
  text,
  trailing,
  boldClassName = 'font-semibold',
}: {
  text: string
  trailing?: ReactNode
  boldClassName?: string
}) {
  const paragraphs = text.split(/\n{2,}/)
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="text-inherit">
          {para.split(/(\*\*.+?\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j} className={boldClassName}>
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
          {i === paragraphs.length - 1 && trailing}
        </p>
      ))}
    </>
  )
}
