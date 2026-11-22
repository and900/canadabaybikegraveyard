// "Notify the service provider?" (§4.2): an email to a tag's operator that the visitor's own email app sends.
import { CATEGORIES, OPERATORS, PROBLEMS } from './config'
import { bikeName, withArticle } from './format'
import type { PublicTag } from './schemas'

/** What's wrong, in the words that follow "there is a Lime e-bike". */
const SAYS: Record<(typeof CATEGORIES.bikes.problems)[number], string> = {
  blocking_footpath: 'blocking the footpath',
  knocked_over: 'knocked over',
  blocking_ramp: 'blocking a ramp or driveway',
  in_waterway: 'in a waterway',
  in_park: 'left in a park or reserve',
  damaged: 'that is damaged',
  abandoned: 'abandoned',
}

/**
 * The email about a tag to its operator, with its `mailto:` link and Gmail and Outlook.com compose pages for a device
 * with no email app, or null for a "Not sure" tag, which has no one to
 * write to. `origin` is the site's, as the visitor reached it, for the link to the tag's page. `registration` is a
 * parking report's number plate, which the visitor typed on their own phone: it goes in the email and nowhere else.
 */
export function operatorEmail(tag: PublicTag, origin: string, registration?: string) {
  const to = OPERATORS[tag.operator].email
  if (!to) return null
  const place = [tag.street, tag.suburb].filter(Boolean).join(', ')
  const link = `${origin}/tag/${tag.id}`
  let subject: string
  let message: string
  if (tag.category === 'bikes') {
    const bike = bikeName(tag.operator)
    subject = `${bike}, ${PROBLEMS[tag.problem].toLowerCase()}, ${place}`
    message =
      `I am reporting that there is ${withArticle(bike)} ${SAYS[tag.problem as keyof typeof SAYS]} near ${place}.\n\n` +
      `Coordinates: ${tag.lat}, ${tag.lng}\n` +
      `Tagged on Canada Bay Community Watch: ${link}`
  } else {
    const category = CATEGORIES[tag.category]
    subject = `${category.short}: ${PROBLEMS[tag.problem]}, ${place}`
    message =
      `I am reporting a problem near ${place}.\n\n` +
      `Category: ${category.label}\n` +
      `Issue: ${PROBLEMS[tag.problem]}\n` +
      (registration ? `Registration: ${registration}\n` : '') +
      `Coordinates: ${tag.lat}, ${tag.lng}\n` +
      `Logged on Canada Bay Community Watch: ${link}`
  }
  // A mailto body breaks its lines with CRLF (RFC 6068).
  const body = encodeURIComponent(message.replaceAll('\n', '\r\n'))
  const [eTo, eSubject, eMessage] = [to, subject, message].map(encodeURIComponent)
  return {
    to,
    subject,
    message,
    href: `mailto:${to}?subject=${eSubject}&body=${body}`,
    // The web compose pages take plain LF line breaks.
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${eTo}&su=${eSubject}&body=${eMessage}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${eTo}&subject=${eSubject}&body=${eMessage}`,
  }
}
