/**
 * Test script to verify all database queries work
 * Run with: tsx src/server/actions/test-queries.ts
 */

import { getCurrentOrganization, getCurrentUser } from "./organizations";
import { getProjectsByOrg, getProjectById } from "./projects";
import { getEpisodesByProject, getLatestEpisodes, getEpisodeById } from "./episodes";

async function testAllQueries() {
  console.log("\n🧪 Testing Database Queries\n");
  console.log("=" .repeat(50));

  try {
    // Test organization queries
    console.log("\n📁 Testing Organization Queries...");
    const org = await getCurrentOrganization();
    console.log("✅ Organization:", org.name);
    console.log("   ID:", org.id);
    console.log("   Type:", org.type);
    console.log("   Tier:", org.subscriptionTier);

    // Test user queries
    console.log("\n👤 Testing User Queries...");
    const user = await getCurrentUser();
    console.log("✅ User:", user.name);
    console.log("   Email:", user.email);
    console.log("   ID:", user.id);

    // Test project queries
    console.log("\n📋 Testing Project Queries...");
    const projects = await getProjectsByOrg(org.id);
    console.log("✅ Projects found:", projects.length);
    
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log("\n   First Project:");
      console.log("   - Title:", firstProject?.title);
      console.log("   - Status:", firstProject?.isPaused ? "PAUSED" : "ACTIVE");
      console.log("   - Next Episode:", firstProject?.nextScheduledAt?.toLocaleDateString() || "Not scheduled");
      
      // Test single project fetch
      const singleProject = await getProjectById(firstProject!.id);
      console.log("✅ Single project fetch:", singleProject?.title);

      // Test episode queries
      console.log("\n📚 Testing Episode Queries...");
      const episodes = await getEpisodesByProject(firstProject!.id);
      console.log("✅ Episodes found:", episodes.length);
      
      if (episodes.length > 0) {
        const firstEpisode = episodes[0];
        console.log("\n   First Episode:");
        console.log("   - Title:", firstEpisode?.title);
        console.log("   - Status:", firstEpisode?.status);
        console.log("   - Reading time:", firstEpisode?.readingMinutes, "minutes");
        console.log("   - Content length:", firstEpisode?.content.length, "characters");
        
        // Test single episode fetch
        const singleEpisode = await getEpisodeById(firstEpisode!.id);
        console.log("✅ Single episode fetch:", singleEpisode?.title);
      }

      // Test latest episodes
      const latestEpisodes = await getLatestEpisodes(org.id, 3);
      console.log("\n✅ Latest episodes across org:", latestEpisodes.length);
      latestEpisodes.forEach((ep, i) => {
        console.log(`   ${i + 1}. ${ep.title} (${ep.status})`);
      });
    }

    console.log("\n" + "=" .repeat(50));
    console.log("✅ All database queries working correctly!");
    console.log("=" .repeat(50) + "\n");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
testAllQueries()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });