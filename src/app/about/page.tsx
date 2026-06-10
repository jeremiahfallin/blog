import { Badge, Box, Card, Container, Flex, Heading, Section, Text } from "@radix-ui/themes";
import SocialLinks from "@/components/SocialLinks";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = {
  title: "About | Jeremiah Fallin",
  description: "Background, experience, and skills",
};

interface Role {
  role: string;
  org: string;
  location?: string;
  dates: string;
  bullets: string[];
}

const experience: Role[] = [
  {
    role: "Director of Technology",
    org: "Boys & Girls Club of the Umpqua Valley",
    location: "Roseburg, Oregon",
    dates: "June 2014 — Present",
    bullets: [
      "Create and implement lesson plans based on youth interests and teach programming fundamentals.",
      "Designed STEAM Summer camp curriculum.",
      "Initiated and lead the first national Boys & Girls Club esports league — 100+ participants across 14 clubs.",
      "Built a Next.js / tRPC / Prisma / Chakra-UI app to run esports leagues nationwide, currently used by 20+ Boys & Girls Clubs.",
      "Designed availability-aware season scheduling using genetic algorithms and integer linear programming to handle cross-timezone constraints.",
    ],
  },
  {
    role: "Project Mentor",
    org: "The Collab Lab",
    location: "Remote",
    dates: "August 2023 — Present",
    bullets: [
      "Mentor early-stage developers building a React + Firebase application.",
      "Facilitate weekly live meetings, host office hours, and lead agile retrospectives.",
      "Conduct code reviews on incoming pull requests and offer educational resources to level up coding ability.",
      "Deliver instructional modules on key practices like pair programming and Git version control.",
      "Extended curriculum to cover authentication.",
    ],
  },
  {
    role: "Software Developer",
    org: "The Collab Lab",
    location: "Remote",
    dates: "April 2023 — June 2023",
    bullets: [
      "Worked independently and on a team to translate client requirements into application designs and system requirements.",
      "Collaborated with a remote team to resolve ticketed issues in weekly sprints.",
    ],
  },
];

const skills = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "HTML",
  "CSS",
  "Python",
  "SQL",
  "MongoDB",
  "Prisma",
  "Docker",
  "Git",
  "Serverless Functions",
];

const hobbies = ["Coding", "Gaming", "Hiking"];

export default function About() {
  return (
    <Container size="3">
      <Section size="3" className="movies-section">
        <Flex direction="column" gap="6">
          <ScrollReveal>
            <Flex direction="column" gap="3" style={{ maxWidth: "65ch" }}>
              <Heading as="h1" size="8">
                About
              </Heading>
              <Text size="3" style={{ color: "var(--gray-11)", lineHeight: 1.7 }}>
                Results-driven web developer with a foundation in front-end web technologies and a passion
                for creating accessible, engaging, user-centric digital experiences. Proficient in React and
                responsive design principles, with experience working on a variety of projects both
                individually and as part of a team.
              </Text>
              <Box mt="2">
                <SocialLinks size={22} />
              </Box>
            </Flex>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <Flex direction="column" gap="3">
              <Heading as="h2" size="5">
                Experience
              </Heading>
              <Flex direction="column" gap="4">
                {experience.map((role) => (
                  <Card key={`${role.role}-${role.org}`} size="3" className="about-card">
                    <Flex direction="column" gap="2">
                      <Flex justify="between" wrap="wrap" gap="2">
                        <Box>
                          <Text as="div" size="4" weight="bold" style={{ color: "var(--gray-12)" }}>
                            {role.role}
                          </Text>
                          <Text as="div" size="2" style={{ color: "var(--gray-11)" }}>
                            {role.org}
                            {role.location ? ` · ${role.location}` : ""}
                          </Text>
                        </Box>
                        <Text size="2" style={{ color: "var(--gray-10)", fontFamily: "var(--font-body)" }}>
                          {role.dates}
                        </Text>
                      </Flex>
                      <Box as="div" mt="2">
                        <ul style={{ paddingLeft: "1.25rem" }} className="mdx-list">
                          {role.bullets.map((b, i) => (
                            <li key={i} style={{ marginBottom: "0.5rem", lineHeight: 1.6, color: "var(--gray-11)" }}>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Flex>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <Flex direction="column" gap="3">
              <Heading as="h2" size="5">
                Skills
              </Heading>
              <Flex gap="2" wrap="wrap">
                {skills.map((skill) => (
                  <Badge key={skill} variant="soft" radius="full" size="2">
                    {skill}
                  </Badge>
                ))}
              </Flex>
            </Flex>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <Flex direction="column" gap="3">
              <Heading as="h2" size="5">
                Hobbies
              </Heading>
              <Flex gap="2" wrap="wrap">
                {hobbies.map((h) => (
                  <Badge key={h} variant="outline" radius="full" size="2" color="gray">
                    {h}
                  </Badge>
                ))}
              </Flex>
            </Flex>
          </ScrollReveal>
        </Flex>
      </Section>
    </Container>
  );
}
