/**
 * Seed script for Many Futures database
 * 
 * Run with: tsx src/server/db/seed.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = "postgresql://postgres.gpxdwwtfwxxbgnzehvvc:9CB3ZRO0XUn3TtGe@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

const main = async () => {
	console.log("🌱 Starting seed script...");
	
	// Create database connection
	const client = postgres(DATABASE_URL);
	const db = drizzle(client, { schema });
	
	try {
		// Create test user
		console.log("Creating test user...");
		const [testUser] = await db
			.insert(schema.users)
			.values({
				clerkId: "user_test_clerk_id",
				email: "test@manyfutures.ai",
				name: "Test User",
				timezone: "Europe/London",
			})
			.returning();
		
		console.log("✅ User created:", testUser?.email);
		
		// Create personal organization
		console.log("Creating organization...");
		const [testOrg] = await db
			.insert(schema.organizations)
			.values({
				name: "Test User's Workspace",
				type: "PERSONAL",
				ownerId: testUser!.id,
				subscriptionTier: "TRIAL",
				dailyCostLimit: "50.00",
				episodeCostLimit: "3.00",
			})
			.returning();
		
		console.log("✅ Organization created:", testOrg?.name);
		
		// Add user to organization
		console.log("Adding user to organization...");
		await db.insert(schema.organizationMembers).values({
			organizationId: testOrg!.id,
			userId: testUser!.id,
			role: "OWNER",
		});
		
		// Create test project
		console.log("Creating test project...");
		const [testProject] = await db
			.insert(schema.projects)
			.values({
				organizationId: testOrg!.id,
				userId: testUser!.id,
				title: "Future of AI Security",
				onboardingBrief: {
					conversation: [
						{
							role: "user",
							content: "I want to understand how AI will impact cybersecurity",
						},
						{
							role: "assistant",
							content:
								"Great topic! What's your role and what specific aspects interest you most?",
						},
						{
							role: "user",
							content:
								"I'm a CISO at a fintech company. Interested in both threats and defenses.",
						},
						{
							role: "assistant",
							content:
								"Perfect. I'll focus on AI-powered threats, defensive AI systems, and regulatory implications for financial services.",
						},
					],
				},
				cadenceConfig: {
					mode: "weekly",
					days: [1, 4],
					deliveryHour: 9,
				},
				status: "ACTIVE",
				nextScheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
			})
			.returning();
		
		console.log("✅ Project created:", testProject?.title);
		
		// Create published episodes
		console.log("Creating episodes...");
		const episode1Content = `# The Rise of Adversarial AI

## Executive Summary

The cybersecurity landscape is experiencing a fundamental shift as adversarial AI becomes increasingly sophisticated. Recent developments suggest that 2025 will be a pivotal year for AI-powered cyber threats.

## Key Developments

### 1. Automated Vulnerability Discovery

Machine learning models are now capable of discovering zero-day vulnerabilities at unprecedented rates. According to recent research from MIT CSAIL, automated systems have identified 47% more vulnerabilities in common software packages compared to traditional methods.

### 2. Defensive AI Evolution

In response to growing threats, defensive AI systems are evolving rapidly:
- **Behavioral analytics** detecting anomalies with 94% accuracy
- **Predictive threat modeling** anticipating attacks 72 hours in advance
- **Automated response systems** reducing incident response time by 80%

## Implications for Financial Services

Financial institutions face unique challenges:
1. Regulatory compliance with AI decision-making
2. Protecting customer data from AI-powered attacks
3. Balancing automation with human oversight

## Strategic Recommendations

- Invest in AI-powered security operations centers
- Develop adversarial testing protocols
- Create cross-functional AI security teams
- Establish partnerships with AI security vendors

## Looking Ahead

The next 6-12 months will likely see increased investment in defensive AI capabilities, with particular focus on explainable AI for security applications.`;
		
		const [episode1] = await db
			.insert(schema.episodes)
			.values({
				projectId: testProject!.id,
				organizationId: testOrg!.id,
				title: "The Rise of Adversarial AI",
				content: episode1Content,
				sources: [
					{
						title: "MIT CSAIL Adversarial AI Report",
						url: "https://example.com/mit-report",
						credibilityScore: 0.95,
					},
					{
						title: "Gartner Security & Risk Summit Insights",
						url: "https://example.com/gartner",
						credibilityScore: 0.9,
					},
					{
						title: "Financial Services AI Security Guidelines",
						url: "https://example.com/fsa",
						credibilityScore: 0.88,
					},
				],
				status: "PUBLISHED",
				scheduledFor: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
				generationStartedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000), // 4 hours before
				publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 mins after scheduled
				deliveredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
				episodeNumber: 1,
				readingMinutes: 8,
			})
			.returning();
		
		console.log("✅ Episode 1 created:", episode1?.title);
		
		// Create block for episode
		await db.insert(schema.blocks).values({
			episodeId: episode1!.id,
			organizationId: testOrg!.id,
			type: "MARKDOWN",
			content: episode1Content,
			position: 10,
			title: "Main Content",
		});
		
		// Create second episode
		const episode2Content = `# Quantum Computing's Impact on Encryption

## The Quantum Threat Timeline

Recent breakthroughs at IBM and Google suggest quantum computers capable of breaking current encryption standards may arrive sooner than expected. The "Y2Q" moment—when quantum computers can break RSA-2048—has been revised from 2035 to potentially 2029.

## Current State of Post-Quantum Cryptography

NIST has standardized four quantum-resistant algorithms:
- CRYSTALS-Kyber (key encapsulation)
- CRYSTALS-Dilithium (digital signatures)
- FALCON (digital signatures)
- SPHINCS+ (hash-based signatures)

## Migration Challenges for Financial Services

Financial institutions face significant hurdles:
1. **Legacy system compatibility** - 60% of banking systems still use deprecated encryption
2. **Performance overhead** - Post-quantum algorithms increase computational requirements by 3-5x
3. **Regulatory uncertainty** - No clear mandates on migration timelines

## Strategic Actions

Immediate steps for CISOs:
- Conduct cryptographic inventory
- Pilot post-quantum algorithms in non-critical systems
- Develop crypto-agility frameworks
- Engage with standards bodies`;
		
		const [episode2] = await db
			.insert(schema.episodes)
			.values({
				projectId: testProject!.id,
				organizationId: testOrg!.id,
				title: "Quantum Computing and Encryption",
				content: episode2Content,
				sources: [
					{
						title: "NIST Post-Quantum Cryptography Standards",
						url: "https://example.com/nist-pqc",
						credibilityScore: 0.98,
					},
					{
						title: "IBM Quantum Network Report",
						url: "https://example.com/ibm-quantum",
						credibilityScore: 0.92,
					},
				],
				status: "PUBLISHED",
				scheduledFor: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
				generationStartedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
				publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
				deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
				episodeNumber: 2,
				readingMinutes: 6,
			})
			.returning();
		
		console.log("✅ Episode 2 created:", episode2?.title);
		
		// Create draft episode (future)
		const [draftEpisode] = await db
			.insert(schema.episodes)
			.values({
				projectId: testProject!.id,
				organizationId: testOrg!.id,
				title: "Zero Trust Architecture Evolution",
				status: "DRAFT",
				scheduledFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
				episodeNumber: 3,
			})
			.returning();
		
		console.log("✅ Draft episode created:", draftEpisode?.title);
		
		// Add to schedule queue
		await db.insert(schema.episodeScheduleQueue).values({
			episodeId: draftEpisode!.id,
			organizationId: testOrg!.id,
			generationStartTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000), // 4 hours before delivery
			targetDeliveryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
			status: "pending",
			priority: 5,
		});
		
		// Add planning notes
		console.log("Creating planning notes...");
		await db.insert(schema.planningNotes).values([
			{
				projectId: testProject!.id,
				organizationId: testOrg!.id,
				userId: testUser!.id,
				episodeId: episode1!.id,
				note: "Can you include more specific examples of AI attacks on financial institutions?",
				noteType: "CONTENT_REQUEST",
				status: "pending",
				priority: 7,
				scope: "NEXT_EPISODE",
			},
			{
				projectId: testProject!.id,
				organizationId: testOrg!.id,
				userId: testUser!.id,
				episodeId: episode2!.id,
				note: "The quantum timeline section was particularly valuable - more like this please",
				noteType: "POSITIVE_FEEDBACK",
				status: "incorporated",
				priority: 5,
				scope: "FUTURE",
			},
		]);
		
		console.log("✅ Planning notes created");
		
		// Add user events
		console.log("Creating user events...");
		await db.insert(schema.userEvents).values([
			{
				userId: testUser!.id,
				organizationId: testOrg!.id,
				eventType: "project_created",
				eventData: {
					projectId: testProject!.id,
					title: "Future of AI Security",
				},
			},
			{
				userId: testUser!.id,
				organizationId: testOrg!.id,
				eventType: "episode_opened",
				eventData: {
					episodeId: episode1!.id,
					duration: 0,
				},
			},
			{
				userId: testUser!.id,
				organizationId: testOrg!.id,
				eventType: "episode_completed",
				eventData: {
					episodeId: episode1!.id,
					duration: 485,
					scrollDepth: 100,
				},
			},
		]);
		
		console.log("✅ User events created");
		
		// Add token usage
		console.log("Creating token usage records...");
		await db.insert(schema.tokenUsage).values([
			{
				organizationId: testOrg!.id,
				episodeId: episode1!.id,
				model: "gpt-4-turbo",
				operation: "generation",
				promptTokens: 2500,
				completionTokens: 1800,
				totalTokens: 4300,
				totalCost: "0.086",
				userId: testUser!.id,
			},
			{
				organizationId: testOrg!.id,
				episodeId: episode2!.id,
				model: "gpt-4-turbo",
				operation: "generation",
				promptTokens: 2200,
				completionTokens: 1600,
				totalTokens: 3800,
				totalCost: "0.076",
				userId: testUser!.id,
			},
		]);
		
		console.log("✅ Token usage created");
		
		// Summary
		console.log("\n🎉 Seed completed successfully!");
		console.log("📊 Summary:");
		console.log("- 1 user created");
		console.log("- 1 organization created");
		console.log("- 1 project created");
		console.log("- 3 episodes created (2 published, 1 draft)");
		console.log("- 2 planning notes created");
		console.log("- 3 user events created");
		console.log("- 2 token usage records created");
		
		console.log("\n📝 Test credentials:");
		console.log("Email:", testUser!.email);
		console.log("Organization:", testOrg!.name);
		console.log("Project:", testProject!.title);
		
	} catch (error) {
		console.error("❌ Seed failed:", error);
		throw error;
	} finally {
		await client.end();
	}
};

// Run the seed
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});