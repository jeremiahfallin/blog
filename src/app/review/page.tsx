import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Section,
  Text,
  TextField,
} from "@radix-ui/themes";
import type { Metadata } from "next";
import { readReviewState } from "@/utils/watchStore";
import type { PosterMap, QueuedWatch, WatchEntry } from "@/utils/watchQueue";
import { answerWatch, undoAnswer } from "./actions";

// Reads the queue and history from disk on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review new watches",
  robots: { index: false, follow: false },
};

const UP_NEXT_LIMIT = 15;

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Poster({ path, title }: { path: string | null | undefined; title: string }) {
  return path ? (
    <Image
      src={`https://image.tmdb.org/t/p/w185${path}`}
      alt={`Poster for ${title}`}
      width={92}
      height={138}
      className="review-poster"
    />
  ) : (
    <span className="review-poster review-poster-empty" aria-hidden>
      🎬
    </span>
  );
}

function FilmPanel({
  label,
  title,
  date,
  posterPath,
  children,
}: {
  label: string;
  title: string;
  date: string;
  posterPath: string | null | undefined;
  children?: React.ReactNode;
}) {
  return (
    <Flex gap="3" align="start" className="review-film">
      <Poster path={posterPath} title={title} />
      <Flex direction="column" gap="1">
        <Text size="1" color="gray" weight="bold" className="review-label">
          {label}
        </Text>
        <Text size="4" weight="bold">
          {title}
        </Text>
        <Text size="2" color="gray">
          {formatDate(date)}
        </Text>
        {children}
      </Flex>
    </Flex>
  );
}

function Comparison({
  current,
  previous,
  history,
  posters,
}: {
  current: QueuedWatch;
  previous: WatchEntry | undefined;
  history: WatchEntry[];
  posters: PosterMap;
}) {
  const isRewatch = history.some((e) => e.title === current.title);
  const sameAsPrevious =
    previous !== undefined &&
    previous.title.toLowerCase() === current.title.toLowerCase();

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Box className="review-pair">
          {previous ? (
            <FilmPanel
              label="Watched before"
              title={previous.title}
              date={previous.dateWatched}
              posterPath={posters[previous.title]?.posterPath}
            />
          ) : (
            <Text color="gray">Nothing recorded yet, so this one is the start.</Text>
          )}
          <FilmPanel
            label="Just watched"
            title={current.title}
            date={current.dateWatched}
            posterPath={current.poster?.posterPath ?? posters[current.title]?.posterPath}
          >
            <Flex gap="2" wrap="wrap" mt="1">
              {isRewatch && <Badge color="blue">Rewatch</Badge>}
              {current.title !== current.plexTitle && (
                <Badge color="gray">Plex calls it “{current.plexTitle}”</Badge>
              )}
            </Flex>
          </FilmPanel>
        </Box>

        {/* Keyed per watch so the title field never carries over to the next film. */}
        <form action={answerWatch} key={current.plexKey}>
          <input type="hidden" name="plexKey" value={current.plexKey} />
          <Flex direction="column" gap="3">
            <Heading as="h2" size="5">
              {previous
                ? `Was ${current.title} better than ${previous.title}?`
                : `Record ${current.title}?`}
            </Heading>
            {sameAsPrevious && (
              <Text size="2" color="amber">
                This is the same film as the one before it, so there is nothing
                to compare. Choose “Can’t compare”.
              </Text>
            )}
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="review-title" size="2" weight="bold">
                Record as
              </Text>
              <TextField.Root
                id="review-title"
                name="title"
                defaultValue={current.title}
                aria-describedby="review-title-hint"
                style={{ maxWidth: 420 }}
              />
              <Text as="div" id="review-title-hint" size="1" color="gray">
                Change it to match how you named this film before, so rewatches
                count as the same film.
              </Text>
            </Flex>
            <Flex gap="2" wrap="wrap">
              {previous && (
                <>
                  <Button type="submit" name="answer" value="better" color="green" size="3">
                    Better
                  </Button>
                  <Button type="submit" name="answer" value="worse" color="red" size="3">
                    Worse
                  </Button>
                </>
              )}
              <Button type="submit" name="answer" value="skip" variant="soft" size="3">
                {previous ? "Can’t compare" : "Record it"}
              </Button>
              <Button type="submit" name="answer" value="dismiss" variant="ghost" color="gray" size="3">
                Not a real watch
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

export default function ReviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const { history, queue, posters } = readReviewState(process.cwd());
  const [current, ...upNext] = queue.pending;
  const previous = history.reduce<WatchEntry | undefined>(
    (latest, e) => (latest === undefined || e.order > latest.order ? e : latest),
    undefined
  );
  const last = queue.lastAnswered;

  return (
    <Container size="3">
      <Section size="2">
        <Flex direction="column" gap="5">
          <Flex direction="column" gap="2" style={{ maxWidth: "65ch" }}>
            <Heading as="h1" size="8">
              Review new watches
            </Heading>
            <Text size="3" color="gray">
              Each answer compares a film with the one recorded just before it,
              so the watches come one at a time, oldest first. Fetch new ones
              from Plex with <Code>npm run sync:plex</Code>. This page only
              works locally.
            </Text>
          </Flex>

          {last && (
            <form action={undoAnswer}>
              <Flex gap="3" align="center" wrap="wrap">
                <Text size="2" color="gray">
                  Last answered: {last.watch.title}
                  {last.addedOrder === null ? " (marked not a real watch)" : ""}
                </Text>
                <Button type="submit" variant="soft" color="gray" size="1">
                  Undo
                </Button>
              </Flex>
            </form>
          )}

          {current ? (
            <>
              <Text size="2" weight="bold">
                {queue.pending.length} waiting
              </Text>
              <Comparison
                current={current}
                previous={previous}
                history={history}
                posters={posters}
              />
            </>
          ) : (
            <Card size="3">
              <Flex direction="column" gap="2">
                <Heading as="h2" size="5">
                  Nothing to review
                </Heading>
                <Text color="gray">
                  Run <Code>npm run sync:plex</Code> to fetch new watches, then
                  reload this page. When you have answered everything, run{" "}
                  <Code>npm run build</Code> to update the rankings and commit
                  the changed files.
                </Text>
              </Flex>
            </Card>
          )}

          {upNext.length > 0 && (
            <Flex direction="column" gap="2">
              <Heading as="h2" size="4">
                Up next
              </Heading>
              <ol className="review-up-next">
                {upNext.slice(0, UP_NEXT_LIMIT).map((w) => (
                  <li key={w.plexKey}>
                    <Text size="2">
                      {w.title}{" "}
                      <Text color="gray">· {formatDate(w.dateWatched)}</Text>
                    </Text>
                  </li>
                ))}
              </ol>
              {upNext.length > UP_NEXT_LIMIT && (
                <Text size="2" color="gray">
                  and {upNext.length - UP_NEXT_LIMIT} more
                </Text>
              )}
            </Flex>
          )}
        </Flex>
      </Section>
    </Container>
  );
}
