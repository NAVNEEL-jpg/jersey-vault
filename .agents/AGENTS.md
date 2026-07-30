# Documentation Synchronization Rule

Whenever the user prompts with the exact phrase "update docs folder" (or similar explicit commands to update documentation), you MUST adhere to the following workflow:

1. **Synchronization First:** Before making any code changes, bug fixes, or fulfilling the rest of the user's request, immediately analyze the current state of the repository.
2. **Update the Docs:** Regenerate and update the following files inside the `docs/` directory to accurately reflect the codebase:
   - `docs/architecture.md`
   - `docs/api-map.md`
   - `docs/routes.md`
   - `docs/database-map.md`
3. **Execute Primary Task:** Only AFTER the documentation is successfully updated, you may proceed to execute the remainder of the user's request on the project files.





# Skills Catalog Usage Rule

Whenever you need to use a skill from the `antigravity-skills` repository to help with a task, follow this workflow to save tokens:

1. **Read the Summary First**: DO NOT search through the individual `SKILL.md` files. Instead, first read the `c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v10\jersey-vault\.gemini\antigravity\skills\skills_summary.xml` file to find the appropriate skill and its description.
2. **Execute the Skill**: Once you have identified the required skill from the summary, navigate directly to `c:\Users\Saptarshi\Desktop\MainFolder\Hackathon\jersey-vault\jersey-vault-navneel\v10\jersey-vault\.gemini\antigravity\skills\skills\<skill_name>\SKILL.md`, read its instructions, and execute it properly.
3. **Remember Context**: This catalog lookup will provide you with the correct skill to use without having to read hundreds of files, keeping the token usage efficient across the chat history.
