import React from 'react';
import {
  Box, Flex, Text, Button, VStack, HStack, Grid, Heading,
} from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faBell, faChevronDown, faChevronRight,
  faHouse, faTag, faFileLines, faCreditCard, faUsers, faBorderAll,
  faClipboardList, faLayerGroup, faDisplay, faGear, faCircleQuestion,
  faGift, faDollarSign, faBuilding, faCircleInfo, faSliders, faArrowRight, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import clientDataJson from './clientData.json';

// ── Client Crush opportunity data ─────────────────────────────
const allOpportunities = clientDataJson.clients
  .filter(c => c.revenueOpportunity?.totalOpportunityValue > 0)
  .map(c => ({
    name: c.company,
    initials: c.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    action: c.recommendedAction.action,
    value: c.revenueOpportunity.totalOpportunityValue,
  }))
  .sort((a, b) => b.value - a.value);

const totalOpportunity = allOpportunities.reduce((s, o) => s + o.value, 0);
const topOpportunities = allOpportunities.slice(0, 3);
const remainingCount   = Math.max(0, allOpportunities.length - 3);

const fmtK     = v => { const k = v / 1000; return k % 1 === 0 ? `$${k}K` : `$${k.toFixed(1)}K`; };
const fmtTotal = v => `+$${v.toLocaleString()}`;

const avatarColors = ['#f97316', '#3b82f6', '#16a34a', '#8b5cf6', '#ef4444', '#0891b2'];

const getEmoji = action => {
  const a = action.toLowerCase();
  if (a.includes('schedule')) return '⚡';
  if (a.includes('upsell'))   return '📋';
  if (a.includes('propose') || a.includes('contract')) return '📅';
  return '⚡';
};

// ── Chart / static data ───────────────────────────────────────
const months         = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
const billingValues  = [78, 52, 46, 42, 65, 56, 74, 88, 50, 46, 42, 42];
const paymentsValues = [82, 50, 40, 30, 56, 50, 44, 86, 60, 44, 40, 36];

const navGroups = [
  [
    { icon: faHouse,         label: 'Home',      active: true },
    { icon: faTag,           label: 'Deals' },
    { icon: faFileLines,     label: 'Proposals' },
    { icon: faCreditCard,    label: 'Payments',  dropdown: true },
  ],
  [
    { icon: faUsers,         label: 'Clients' },
    { icon: faBorderAll,     label: 'Services' },
    { icon: faClipboardList, label: 'Forms' },
    { icon: faLayerGroup,    label: 'Templates', dropdown: true },
  ],
  [
    { icon: faDisplay,       label: 'Apps' },
    { icon: faGear,          label: 'Settings',  dropdown: true },
    { icon: faCircleQuestion,label: 'Help',      dropdown: true },
  ],
];

const proposalStages = [
  { label: 'Draft',       value: '$98k',  sub: '17 proposals',  h: 52, bg: 'purple.200' },
  { label: 'Sent',        value: '$40k',  sub: '8 proposals',   h: 42, bg: 'blue.200' },
  { label: 'Viewed',      value: '$40k',  sub: '6 proposals',   h: 36, bg: 'blue.200' },
  { label: 'Active',      value: '$140k', sub: '34 agreements', h: 68, bg: 'blue.400' },
  { label: 'Ending soon', value: '$35k',  sub: '9 agreements',  h: 46, striped: true },
];

const recentItems = [
  { company: 'John Jones Ltd',            type: 'Proposal name' },
  { company: 'The boring company',        type: 'First engagement proposal' },
  { company: 'ABC lightening shop house', type: 'Ongoing engagement propos...' },
  { company: 'John Jones Ltd',            type: 'Accounting services proposal' },
  { company: 'Pete Andre business',       type: 'New proposal' },
];

// ── Scrollbar hiding sx ───────────────────────────────────────
const noScrollbar = {
  '&::-webkit-scrollbar': { display: 'none' },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
};

// Helper: FA icon wrapped in a Box for color/size control
function Fa({ icon, fontSize = '14px', style }) {
  return (
    <FontAwesomeIcon icon={icon} style={{ fontSize, ...style }} />
  );
}

// ── Small reusable components ─────────────────────────────────
function BarChart({ values, color }) {
  const max = Math.max(...values);
  const barAreaH = 76;
  return (
    <Box>
      <Flex align="flex-end" gap="3px" h={`${barAreaH}px`}>
        {values.map((v, i) => (
          <Flex key={i} flex={1} align="flex-end">
            <Box
              flex={1}
              bg={color}
              borderTopRadius="2px"
              h={`${Math.max(3, (v / max) * barAreaH)}px`}
            />
          </Flex>
        ))}
      </Flex>
      <Flex gap="3px" mt={1}>
        {months.map((m, i) => (
          <Box key={i} flex={1} textAlign="center" fontSize="10px" color="gray.400">{m}</Box>
        ))}
      </Flex>
    </Box>
  );
}

function Stat({ label, children }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" mb={1.5}>{label}</Text>
      {children}
    </Box>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <Box h="3px" bg="gray.100" borderRadius="full" overflow="hidden" mt={2}>
      <Box h="full" borderRadius="full" bg={color} w={`${pct}%`} />
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function HomePage({ onNavigate }) {
  return (
    <Flex h="100vh" bg="white" overflow="hidden" color="gray.900">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <Box
        as="aside"
        w="190px"
        flexShrink={0}
        display="flex"
        flexDir="column"
        bg="gray.50"
        borderRight="1px solid"
        borderColor="gray.200"
        overflowY="auto"
        sx={noScrollbar}
      >
        {/* Logo */}
        <Flex px={3} pt={4} pb={2} align="center" justify="space-between" gap={2}>
          <Flex align="center" gap={1} minW={0}>
            <Text fontWeight="bold" fontSize="18px" letterSpacing="tight" color="#1a5952">ignition</Text>
            <svg width="15" height="15" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M6 0 L7.1 4.9 L12 6 L7.1 7.1 L6 12 L4.9 7.1 L0 6 L4.9 4.9 Z" fill="#f04022"/>
            </svg>
          </Flex>
          <Flex align="center" gap={2} flexShrink={0}>
            <Box as="button" border="none" bg="transparent" p={0} color="gray.400" _hover={{ color: 'gray.600' }} display="flex" cursor="pointer">
              <Fa icon={faMagnifyingGlass} fontSize="13px" />
            </Box>
            <Box as="button" border="none" bg="transparent" p={0} color="gray.400" _hover={{ color: 'gray.600' }} display="flex" cursor="pointer">
              <Fa icon={faBell} fontSize="13px" />
            </Box>
          </Flex>
        </Flex>

        {/* Create new */}
        <Box px={3} pb={3}>
          <Button
            w="full"
            size="sm"
            variant="outline"
            borderColor="red.400"
            color="red.500"
            _hover={{ bg: 'red.50' }}
            leftIcon={<Text as="span" fontSize="md" fontWeight="bold" lineHeight={1}>+</Text>}
            rightIcon={<Fa icon={faChevronDown} fontSize="11px" />}
          >
            Create new
          </Button>
        </Box>

        {/* Nav */}
        <Box as="nav" flex={1} px={2}>
          <VStack spacing={0} align="stretch">
            {navGroups.map((group, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && (
                  <Box px={2} py={2}>
                    <Box h="1px" bg="gray.200" />
                  </Box>
                )}
                {group.map(({ icon, label, active, dropdown }) => (
                  <Flex
                    key={label}
                    as="button"
                    align="center"
                    gap={2.5}
                    px={3}
                    py="8px"
                    border="none"
                    borderRadius="4px 0 0 4px"
                    bg={active ? 'purple.50' : 'transparent'}
                    color={active ? 'purple.500' : 'gray.800'}
                    fontWeight={active ? 'semibold' : 'normal'}
                    fontSize="sm"
                    boxShadow={active ? 'inset -3px 0 0 var(--chakra-colors-purple-500)' : 'none'}
                    _hover={{ bg: active ? 'purple.50' : 'gray.100', color: active ? 'purple.500' : 'gray.900' }}
                    transition="all 0.15s"
                    w="full"
                    cursor="pointer"
                  >
                    <Box flexShrink={0} w="16px" textAlign="center">
                      <Fa icon={icon} fontSize="13px" />
                    </Box>
                    <Text flex={1} textAlign="left">{label}</Text>
                    {dropdown && (
                      <Box color="gray.400" flexShrink={0}>
                        <Fa icon={faChevronDown} fontSize="10px" />
                      </Box>
                    )}
                  </Flex>
                ))}
              </React.Fragment>
            ))}
          </VStack>
        </Box>

        {/* Bottom */}
        <Box px={3} py={3} borderTop="1px solid" borderColor="gray.100">
          <VStack spacing={1.5} align="stretch">
            <Button
              variant="outline"
              size="xs"
              borderColor="gray.200"
              color="gray.600"
              _hover={{ bg: 'gray.50' }}
              justifyContent="flex-start"
              leftIcon={<Box color="blue.500"><Fa icon={faGift} fontSize="12px" /></Box>}
            >
              Refer &amp; earn
            </Button>
            <Flex
              as="button"
              align="center"
              gap={2}
              px={1.5}
              py="5px"
              border="none"
              bg="transparent"
              borderRadius="md"
              _hover={{ bg: 'gray.50' }}
              w="full"
              cursor="pointer"
            >
              <Flex
                w={6} h={6} borderRadius="full" bg="gray.300"
                align="center" justify="center"
                fontSize="10px" fontWeight="bold" color="gray.700" flexShrink={0}
              >G</Flex>
              <Box flex={1} minW={0} textAlign="left">
                <Text fontSize="xs" fontWeight="medium" color="gray.900" isTruncated>Greg Bradbury</Text>
                <Text fontSize="11px" color="gray.500" isTruncated>ABC accounting</Text>
              </Box>
              <Box color="gray.400" flexShrink={0}><Fa icon={faChevronDown} fontSize="10px" /></Box>
            </Flex>
          </VStack>
        </Box>
      </Box>

      {/* ── Main + Right panel ───────────────────────────────── */}
      <Flex flex={1} flexDir="column" minW={0} overflow="hidden">

        {/* Sticky page header */}
        <Box
          flexShrink={0}
          position="sticky"
          top={0}
          zIndex={10}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          px={6}
          py={4}
        >
          <Heading size="lg" fontWeight="semibold" color="gray.900">Home</Heading>
        </Box>

        {/* Content row */}
        <Flex flex={1} minW={0} overflow="hidden">

          {/* Scrollable main content */}
          <Box flex={1} minW={0} overflowY="auto" sx={noScrollbar}>
            <VStack spacing={4} align="stretch" pl={6} pr={0} pt={5} pb={8}>

              {/* Billing */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
                <Flex align="center" justify="space-between" mb={4}>
                  <HStack spacing={2}>
                    <Text fontSize="15px" fontWeight="semibold">Billing</Text>
                    <Text fontSize="xs" color="gray.400">Invoiced through Ignition (incl. tax)</Text>
                  </HStack>
                  <Box color="gray.400" cursor="pointer" _hover={{ color: 'gray.600' }} flexShrink={0}>
                    <Fa icon={faSliders} fontSize="14px" />
                  </Box>
                </Flex>
                <BarChart values={billingValues} color="purple.400" />
                <Grid templateColumns="repeat(3, 1fr)" gap={5} mt={5} pt={4} borderTop="1px solid" borderColor="gray.100">
                  <Stat label="Unbilled">
                    <Flex align="center" flexWrap="wrap" gap={2} rowGap={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>$370</Text>
                      <Text fontSize="xs" color="gray.400" lineHeight={1}>to bill on completion</Text>
                      <Button variant="outline" size="xs" borderColor="gray.300" color="gray.600" _hover={{ bg: 'gray.50' }}>Bill</Button>
                    </Flex>
                  </Stat>
                  <Stat label="Billed this financial year">
                    <HStack align="baseline" spacing={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>$46k</Text>
                      <Text fontSize="xs" color="gray.400">/ $58k</Text>
                    </HStack>
                    <ProgressBar pct={79} color="purple.400" />
                  </Stat>
                  <Stat label="Growth goal">
                    <HStack align="baseline" spacing={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>11%</Text>
                      <Text fontSize="xs" color="gray.400">complete</Text>
                      <Text fontSize="xs" color="gray.400">/ $8k</Text>
                    </HStack>
                    <ProgressBar pct={11} color="purple.400" />
                  </Stat>
                </Grid>
              </Box>

              {/* Payments */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
                <Flex align="center" justify="space-between" mb={4}>
                  <HStack spacing={2}>
                    <Text fontSize="15px" fontWeight="semibold">Payments</Text>
                    <Text fontSize="xs" color="gray.400">through Ignition payments (incl. tax)</Text>
                  </HStack>
                  <Box color="purple.400" cursor="pointer" flexShrink={0}>
                    <Fa icon={faCircleInfo} fontSize="14px" />
                  </Box>
                </Flex>
                <BarChart values={paymentsValues} color="green.400" />
                <Grid templateColumns="repeat(3, 1fr)" gap={5} mt={5} pt={4} borderTop="1px solid" borderColor="gray.100">
                  <Stat label="This month">
                    <HStack align="baseline" spacing={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>$50</Text>
                      <Text fontSize="xs" color="gray.400">/ $495</Text>
                    </HStack>
                    <ProgressBar pct={10} color="green.400" />
                  </Stat>
                  <Stat label="Next month">
                    <HStack align="baseline" spacing={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>$495k</Text>
                      <Text fontSize="xs" color="gray.400">expected</Text>
                    </HStack>
                  </Stat>
                  <Stat label="This financial year">
                    <HStack align="baseline" spacing={1}>
                      <Text fontSize="22px" fontWeight="bold" lineHeight={1}>$0</Text>
                      <Text fontSize="xs" color="gray.400">/ $6.4k</Text>
                    </HStack>
                    <ProgressBar pct={0} color="green.400" />
                  </Stat>
                </Grid>
              </Box>

              {/* Proposals */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
                <HStack spacing={2} mb={6}>
                  <Text fontSize="15px" fontWeight="semibold">Proposals</Text>
                  <Text fontSize="xs" color="gray.400">excludes classic proposals</Text>
                </HStack>
                <Flex align="flex-end">
                  {proposalStages.map((stage, i, arr) => (
                    <React.Fragment key={stage.label}>
                      <Box flex={1} minW={0}>
                        <Flex h="88px" align="flex-end" mb={3}>
                          <Box
                            w="full"
                            borderRadius="sm"
                            bg={!stage.striped ? stage.bg : undefined}
                            style={stage.striped ? {
                              background: 'repeating-linear-gradient(135deg,#3b82f6 0px,#3b82f6 7px,#1d4ed8 7px,#1d4ed8 14px)',
                            } : undefined}
                            h={`${stage.h}px`}
                          />
                        </Flex>
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>{stage.label}</Text>
                        <Text fontSize="18px" fontWeight="bold" mt={0.5}>{stage.value}</Text>
                        <Text fontSize="xs" color="blue.500" mt={0.5}>{stage.sub}</Text>
                      </Box>
                      {i < arr.length - 1 && (
                        <Box flexShrink={0} px={1.5} pb="60px" color="gray.300">
                          <Fa icon={faChevronRight} fontSize="12px" />
                        </Box>
                      )}
                    </React.Fragment>
                  ))}
                </Flex>
              </Box>

              {/* Insights */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5}>
                <HStack spacing={2}>
                  <Text fontSize="15px" fontWeight="semibold">Insights</Text>
                  <Text fontSize="xs" color="gray.400">deeper analysis</Text>
                  <Box ml="auto" color="purple.400" cursor="pointer">
                    <Fa icon={faCircleInfo} fontSize="13px" />
                  </Box>
                </HStack>
              </Box>

            </VStack>
          </Box>

          {/* ── Right panel ──────────────────────────────────── */}
          <Box
            w="400px"
            flexShrink={0}
            overflowY="auto"
            sx={noScrollbar}
            ml={6}
            pr={5}
            pt={5}
            pb={8}
          >
            <VStack spacing={4} align="stretch">

              {/* Client Crush widget */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                <Box bg="#F4EFFF" borderBottom="1px solid" borderColor="rgba(213, 210, 249, 1)" px={4} pt={4} pb={4}>
                  <Flex align="center" justify="space-between" mb={3}>
                    <HStack spacing={1.5}>
                      <Text fontSize="xl">💘</Text>
                      <Text fontWeight="semibold" fontSize="18px" color="purple.900">Client Crush</Text>
                      <Box
                        px={1.5}
                        py={0.5}
                        borderRadius="md"
                        bg="linear-gradient(135deg, #7c3aed, #a855f7)"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Text fontSize="10px" fontWeight="bold" color="white" letterSpacing="wider" lineHeight={1}>AI</Text>
                      </Box>
                    </HStack>
                  </Flex>
                  <Text fontWeight="semibold" color="purple.400" letterSpacing="widest" mb={1} textTransform="none" style={{ fontSize: '12px' }}>
                    Revenue opportunity found
                  </Text>
                  <Text fontSize="24px" fontWeight="black" color="purple.900" lineHeight={1} mb={1} textTransform="none">
                    {fmtTotal(totalOpportunity)}
                  </Text>
                </Box>

                <Box p={4}>
                  <Text fontSize="11px" fontWeight="semibold" color="gray.700" letterSpacing="widest" mb={3}>
                    Top opportunities
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {topOpportunities.map((opp, i) => (
                      <Flex key={i} align="center" gap={3} bg="gray.50" borderRadius="xl" p={3}>
                        <Flex
                          w={9} h={9} borderRadius="full"
                          align="center" justify="center"
                          color="white" fontWeight="bold" fontSize="sm" flexShrink={0}
                          style={{ backgroundColor: avatarColors[i % avatarColors.length] }}
                        >
                          {opp.initials}
                        </Flex>
                        <Box flex={1} minW={0}>
                          <Text fontWeight="500" color="gray.900" fontSize="12px" isTruncated textTransform="none">{opp.name}</Text>
                          <Text fontSize="12px" color="purple.500" isTruncated textTransform="none" display="flex" alignItems="center" gap={1}><FontAwesomeIcon icon={faBolt} style={{ width: 10, height: 10, flexShrink: 0 }} />{opp.action}</Text>
                        </Box>
                        <Text fontSize="16px" fontWeight="semibold" color="green.500" flexShrink={0} textTransform="none">+{fmtK(opp.value)}</Text>
                      </Flex>
                    ))}
                  </VStack>

                  {remainingCount > 0 && (
                    <Text fontSize="12px" color="purple.500" fontWeight="medium" mt={2.5}>
                      +{remainingCount} more clients
                    </Text>
                  )}

                  <Button
                    w="full" mt="11px" py={2.5} h="auto"
                    bg="purple.600" color="white" borderRadius="4px"
                    fontWeight="semibold" fontSize="sm"
                    _hover={{ bg: 'purple.700' }}
                    rightIcon={<Fa icon={faArrowRight} fontSize="12px" />}
                    onClick={() => onNavigate?.('clientcrush')}
                  >
                    Review all clients
                  </Button>
                </Box>
              </Box>

              {/* Action required */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
                <Text fontSize="15px" fontWeight="semibold" mb={4}>Action required</Text>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="orange.50" align="center" justify="center" flexShrink={0}>
                      <Box color="orange.500"><Fa icon={faDollarSign} fontSize="14px" /></Box>
                    </Flex>
                    <Text fontSize="sm" color="gray.700">2 Failed payments</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="orange.50" align="center" justify="center" flexShrink={0}>
                      <Box color="orange.500"><Fa icon={faCreditCard} fontSize="14px" /></Box>
                    </Flex>
                    <Text fontSize="sm" color="gray.700">3 Expiring credit card</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="blue.50" align="center" justify="center" flexShrink={0}>
                      <Box color="blue.500"><Fa icon={faBuilding} fontSize="14px" /></Box>
                    </Flex>
                    <Text fontSize="sm" color="gray.700">1 Bank account verification</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Recent */}
              <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={4}>
                <Text fontSize="15px" fontWeight="semibold" mb={4}>Recent</Text>
                <VStack spacing={3} align="stretch">
                  {recentItems.map((item, i) => (
                    <HStack key={i} align="flex-start" spacing={2.5} cursor="pointer" _hover={{ opacity: 0.75 }}>
                      <Flex
                        w={6} h={6} borderRadius="md" border="1px solid" borderColor="gray.200"
                        bg="gray.50" align="center" justify="center" flexShrink={0} mt={0.5}
                      >
                        <Box color="gray.400"><Fa icon={faFileLines} fontSize="11px" /></Box>
                      </Flex>
                      <Box minW={0}>
                        <Text fontSize="sm" fontWeight="medium" color="gray.900" isTruncated>{item.company}</Text>
                        <Text fontSize="xs" color="gray.400" isTruncated>{item.type}</Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </Box>

            </VStack>
          </Box>

        </Flex>
      </Flex>
    </Flex>
  );
}
