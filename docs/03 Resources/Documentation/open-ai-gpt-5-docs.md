[Using GPT-5
===========

Learn best practices, features, and migration guidance for GPT-5.

Overview
--------

GPT-5 is our most intelligent model yet, trained to be especially proficient in:

*   Code generation, bug fixing, and refactoring
*   Instruction following
*   Long context and tool calling

New API features releasing alongside this model include the ability to control verbosity, a minimal reasoning effort option, custom tools, and an allowed tools list.

This guide walks through some of the key features of the GPT-5 model family and how to get the most out of these models.

Meet the models
---------------

There are three models in the GPT-5 series. In general, `gpt-5` is best for your most complex tasks that require broad world knowledge. The smaller mini and nano models trade off some general world knowledge for lower cost and lower latency. Small models will tend to perform better for more well defined tasks.

To help you pick the model that best fits your use case, consider these tradeoffs:

|Variant|Best for|
|---|---|
|gpt-5|Complex reasoning, broad world knowledge, and code-heavy or multi-step agentic tasks|
|gpt-5-mini|Cost-optimized reasoning and chat; balances speed, cost, and capability|
|gpt-5-nano|High-throughput tasks, especially simple instruction-following or classification|

New API features in GPT-5
-------------------------

Alongside GPT-5, we're introducing a few new parameters and API features designed to give developers more control and flexibility.

### Minimal reasoning effort

The `reasoning.effort` parameter controls how many reasoning tokens the model generates before producing a response. Earlier reasoning models like o3 supported only `low`, `medium`, and `high`: `low` favored speed and fewer tokens, while `high` favored more thorough reasoning.

The new `minimal` setting produces very few reasoning tokens for cases where you need the fastest possible time-to-first-token. We often see better performance when the model can produce a few tokens when needed versus none. The default is `medium`.

The `minimal` setting performs especially well in coding and instruction following scenarios, adhering closely to given directions. However, it may require prompting to act more proactively. To improve the model's reasoning quality, even at minimal effort, encourage it to “think” or outline its steps before answering.

Minimal reasoning effort

```bash
curl --request POST   --url https://api.openai.com/v1/responses   --header "Authorization: Bearer $OPENAI_API_KEY"   --header 'Content-type: application/json'   --data '{
	"model": "gpt-5",
	"input": "How much gold would it take to coat the Statue of Liberty in a 1mm layer?",
	"reasoning": {
		"effort": "minimal"
	}
}'
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-5",
  input: "How much gold would it take to coat the Statue of Liberty in a 1mm layer?",
  reasoning: {
    effort: "minimal"
  }
});

console.log(response);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    input="How much gold would it take to coat the Statue of Liberty in a 1mm layer?",
    reasoning={
        "effort": "minimal"
    }
)

print(response)
```

### Verbosity

Verbosity determines how many output tokens are generated. Lowering the number of tokens reduces overall latency. While the model's reasoning approach stays mostly the same, the model finds ways to answer more concisely—which can either improve or diminish answer quality, depending on your use case. Here are some scenarios for both ends of the verbosity spectrum:

*   **High verbosity:** Use when you need the model to provide thorough explanations of documents or perform extensive code refactoring.
*   **Low verbosity:** Best for situations where you want concise answers or simple code generation, such as SQL queries.

Models before GPT-5 have used `medium` verbosity by default. With GPT-5, we make this option configurable as one of `high`, `medium`, or `low`.

When generating code, `medium` and `high` verbosity levels yield longer, more structured code with inline explanations, while `low` verbosity produces shorter, more concise code with minimal commentary.

Control verbosity

```bash
curl --request POST   --url https://api.openai.com/v1/responses   --header "Authorization: Bearer $OPENAI_API_KEY"   --header 'Content-type: application/json'   --data '{
  "model": "gpt-5",
  "input": "What is the answer to the ultimate question of life, the universe, and everything?",
  "text": {
    "verbosity": "low"
  }
}'
```

```javascript
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-5",
  input: "What is the answer to the ultimate question of life, the universe, and everything?",
  text: {
    verbosity: "low"
  }
});

console.log(response);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    input="What is the answer to the ultimate question of life, the universe, and everything?",
    text={
        "verbosity": "low"
    }
)

print(response)
```

You can still steer verbosity through prompting after setting it to `low` in the API. The verbosity parameter defines a general token range at the system prompt level, but the actual output is flexible to both developer and user prompts within that range.

### Custom tools

With GPT-5, we're introducing a new capability called custom tools, which lets models send any raw text as tool call input but still constrain outputs if desired.

[

Function calling guide

Learn about custom tools in the function calling guide.

](/docs/guides/function-calling)

#### Freeform inputs

Define your tool with `type: custom` to enable models to send plaintext inputs directly to your tools, rather than being limited to structured JSON. The model can send any raw text—code, SQL queries, shell commands, configuration files, or long-form prose—directly to your tool.

```bash
{
    "type": "custom",
    "name": "code_exec",
    "description": "Executes arbitrary python code",
}
```

#### Constraining outputs

GPT-5 supports context-free grammars (CFGs) for custom tools, letting you provide a Lark grammar to constrain outputs to a specific syntax or DSL. Attaching a CFG (e.g., a SQL or DSL grammar) ensures the assistant's text matches your grammar.

This enables precise, constrained tool calls or structured responses and lets you enforce strict syntactic or domain-specific formats directly in GPT-5's function calling, improving control and reliability for complex or constrained domains.

#### Best practices for custom tools

*   **Write concise, explicit tool descriptions**. The model chooses what to send based on your description; state clearly if you want it to always call the tool.
*   **Validate outputs on the server side**. Freeform strings are powerful but require safeguards against injection or unsafe commands.

### Allowed tools

The `allowed_tools` parameter under `tool_choice` in the GPT-5 Responses API lets you pass N tool definitions but restrict the model to only M (< N) of them. List your full toolkit in `tools`, and then use an `allowed_tools` block to name the subset and specify a mode—either `auto` (the model may pick any of those) or `required` (the model must invoke one).

[

Function calling guide

Learn about the allowed tools option in the function calling guide.

](/docs/guides/function-calling)

By separating all possible tools from the subset that can be used _now_, you gain greater safety, predictability, and improved prompt caching. You also avoid brittle prompt engineering, such as hard-coded call order. GPT-5 dynamically invokes or requires specific functions mid-conversation while reducing the risk of unintended tool usage over long contexts.

||Standard Tools|Allowed Tools|
|---|---|---|
|Model's universe|All tools listed under "tools": […]|Only the subset under "tools": […] in tool_choice|
|Tool invocation|Model may or may not call any tool|Model restricted to (or required to call) chosen tools|
|Purpose|Declare available capabilities|Constrain which capabilities are actually used|

```bash
"tool_choice": {
    "type": "allowed_tools",
    "mode": "auto",
    "tools": [
      { "type": "function", "name": "get_weather" },
      { "type": "mcp", "server_label": "deepwiki" },
      { "type": "image_generation" }
    ]
  }
}'
```

Preambles
---------

Preambles are brief, user-visible explanations that GPT-5 generates before invoking any tool or function, outlining its intent or plan (e.g., “why I'm calling this tool”). They appear after the chain-of-thought and before the actual tool call, providing transparency into the model's reasoning and enhancing debuggability, user confidence, and fine-grained steerability.

By letting GPT-5 “think out loud” before each tool call, preambles boost tool-calling accuracy (and overall task success) without bloating reasoning overhead. To enable preambles, add a system or developer instruction—for example: “Before you call a tool, explain why you are calling it.” GPT-5 prepends a concise rationale to each specified tool call. The model may also output multiple messages between tool calls, which can enhance the interaction experience—particularly for minimal reasoning or latency-sensitive use cases.

For a more detailed overview of all of these new features, see the [accompanying cookbook](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools).

Migration guidance
------------------

GPT-5 is our best model yet, and it works best with the Responses API, which supports for passing chain of thought (CoT) between turns. Read below to migrate from your current model or API.

### Migrating from other models to GPT-5

We see improved intelligence because the Responses API can pass the previous turn's CoT to the model. This leads to fewer generated reasoning tokens, higher cache hit rates, and less latency. To learn more, see an [in-depth guide](https://cookbook.openai.com/examples/responses_api/reasoning_items) on the benefits of responses.

When migrating to GPT-5 from an older OpenAI model, start by experimenting with reasoning levels and prompting strategies. Based on our testing, we recommend using our [prompt optimizer](http://platform.openai.com/chat/edit?optimize=true)—which automatically updates your prompts for GPT-5 based on our best practices—and following this model-specific guidance:

*   **o3**: `gpt-5` with `medium` or `high` reasoning is a great replacement. Start with `medium` reasoning with prompt tuning, then increasing to `high` if you aren't getting the results you want.
*   **gpt-4.1**: `gpt-5` with `minimal` or `low` reasoning is a strong alternative. Start with `minimal` and tune your prompts; increase to `low` if you need better performance.
*   **o4-mini or gpt-4.1-mini**: `gpt-5-mini` with prompt tuning is a great replacement.
*   **gpt-4.1-nano**: `gpt-5-nano` with prompt tuning is a great replacement.

### Migrating from Chat Completions to Responses API

The biggest difference, and main reason to migrate from Chat Completions to the Responses API for GPT-5, is support for passing chain of thought (CoT) between turns. See a full [comparison of the APIs](/docs/guides/responses-vs-chat-completions).

Passing CoT exists only in the Responses API, and we've seen improved intelligence, fewer generated reasoning tokens, higher cache hit rates, and lower latency as a result of doing so. Most other parameters remain at parity, though the formatting is different. Here's how new parameters are handled differently between Chat Completions and the Responses API:

**Reasoning effort**

Responses API

Generate response with minimal reasoning

```json
curl --request POST \
--url https://api.openai.com/v1/responses \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--header 'Content-type: application/json' \
--data '{
  "model": "gpt-5",
  "input": "How much gold would it take to coat the Statue of Liberty in a 1mm layer?",
  "reasoning": {
    "effort": "minimal"
  }
}'
```

Chat Completions

Generate response with minimal reasoning

```json
curl --request POST \
--url https://api.openai.com/v1/chat/completions \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--header 'Content-type: application/json' \
--data '{
  "model": "gpt-5",
  "messages": [
    {
      "role": "user",
      "content": "How much gold would it take to coat the Statue of Liberty in a 1mm layer?"
    }
  ],
  "reasoning_effort": "minimal"
}'
```

**Verbosity**

Responses API

Control verbosity

```json
curl --request POST \
--url https://api.openai.com/v1/responses \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--header 'Content-type: application/json' \
--data '{
  "model": "gpt-5",
  "input": "What is the answer to the ultimate question of life, the universe, and everything?",
  "text": {
    "verbosity": "low"
  }
}'
```

Chat Completions

Control verbosity

```json
curl --request POST \
--url https://api.openai.com/v1/chat/completions \
--header "Authorization: Bearer $OPENAI_API_KEY" \
--header 'Content-type: application/json' \
--data '{
  "model": "gpt-5",
  "messages": [
    { "role": "user", "content": "What is the answer to the ultimate question of life, the universe, and everything?" }
  ],
  "verbosity": "low"
}'
```

**Custom tools**

Responses API

Custom tool call

```json
curl --request POST --url https://api.openai.com/v1/responses --header "Authorization: Bearer $OPENAI_API_KEY" --header 'Content-type: application/json' --data '{
  "model": "gpt-5",
  "input": "Use the code_exec tool to calculate the area of a circle with radius equal to the number of r letters in blueberry",
  "tools": [
    {
      "type": "custom",
      "name": "code_exec",
      "description": "Executes arbitrary python code"
    }
  ]
}'
```

Chat Completions

Custom tool call

```json
curl --request POST --url https://api.openai.com/v1/chat/completions --header "Authorization: Bearer $OPENAI_API_KEY" --header 'Content-type: application/json' --data '{
  "model": "gpt-5",
  "messages": [
    { "role": "user", "content": "Use the code_exec tool to calculate the area of a circle with radius equal to the number of r letters in blueberry" }
  ],
  "tools": [
    {
      "type": "custom",
      "custom": {
        "name": "code_exec",
        "description": "Executes arbitrary python code"
      }
    }
  ]
}'
```

Prompting guidance
------------------

We specifically designed GPT-5 to excel at coding, frontend engineering, and tool-calling for agentic tasks. We also recommend iterating on prompts for GPT-5 using the [prompt optimizer](/chat/edit?optimize=true).

[

GPT-5 prompt optimizer

Craft the perfect prompt for GPT-5 in the dashboard

](/chat/edit?optimize=true)[

GPT-5 prompting guide

Learn full best practices for prompting GPT-5 models

](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)[

Frontend prompting for GPT-5

See prompt samples specific to frontend development

](https://cookbook.openai.com/examples/gpt-5_frontend)

### GPT-5 is a reasoning model

Reasoning models like GPT-5 break problems down step by step, producing an internal chain of thought that encodes their reasoning. To maximize performance, pass these reasoning items back to the model: this avoids re-reasoning and keeps interactions closer to the model's training distribution. In multi-turn conversations, passing a `previous_response_id` automatically makes earlier reasoning items available. This is especially important when using tools—for example, when a function call requires an extra round trip. In these cases, either include them with `previous_response_id` or add them directly to `input`.

Learn more about reasoning models and how to get the most out of them in our [reasoning guide](/docs/guides/reasoning).

Further reading
---------------

[GPT-5 prompting guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)

[GPT-5 frontend guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_frontend)

[GPT-5 new features guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_new_params_and_tools)

[Cookbook on reasoning models](https://cookbook.openai.com/examples/responses_api/reasoning_items)

[Comparison of Responses API versus Chat Completions](https://www.notion.so/GPT-5-Docs-Draft-2418e50b62b0800f8e86e2ee0d9f3b69?pvs=21)

FAQ
---

1.  **How are these models integrated into ChatGPT?**
    
    In ChatGPT, there are two models: `gpt-5-chat` and `gpt-5-thinking`. They offer reasoning and minimal-reasoning capabilities, with a routing layer that selects the best model based on the user's question. Users can also invoke reasoning directly through the ChatGPT UI.
    
2.  **Will these models be supported in Codex?**
    
    Yes, `gpt-5` will be available in Codex and Codex CLI.
    
3.  **What is the deprecation plan for previous models?**
    
    Any model deprecations will be posted on our [deprecations page](/docs/deprecations#page-top). We'll send advanced notice of any model deprecations.
    

]

[Text generation
===============

Learn how to prompt a model to generate text.

With the OpenAI API, you can use a [large language model](/docs/models) to generate text from a prompt, as you might using [ChatGPT](https://chatgpt.com). Models can generate almost any kind of text response—like code, mathematical equations, structured JSON data, or human-like prose.

Here's a simple example using the [Chat Completions API](/docs/api-reference/chat).

Generate text from a simple prompt

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const completion = await client.chat.completions.create({
    model: "gpt-5",
    messages: [
        {
            role: "user",
            content: "Write a one-sentence bedtime story about a unicorn.",
        },
    ],
});

console.log(completion.choices[0].message.content);
```

```python
from openai import OpenAI
client = OpenAI()

completion = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {
            "role": "user",
            "content": "Write a one-sentence bedtime story about a unicorn."
        }
    ]
)

print(completion.choices[0].message.content)
```

```bash
curl "https://api.openai.com/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-5",
        "messages": [
            {
                "role": "user",
                "content": "Write a one-sentence bedtime story about a unicorn."
            }
        ]
    }'
```

An array of content generated by the model is in the `choices` property of the response. In this simple example, we have just one output which looks like this:

```json
[
    {
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "Under the soft glow of the moon, Luna the unicorn danced through fields of twinkling stardust, leaving trails of dreams for every child asleep.",
            "refusal": null
        },
        "logprobs": null,
        "finish_reason": "stop"
    }
]
```

In addition to plain text, you can also have the model return structured data in JSON format - this feature is called [**Structured Outputs**](/docs/guides/structured-outputs).

Prompt engineering
------------------

**Prompt engineering** is the process of writing effective instructions for a model, such that it consistently generates content that meets your requirements.

Because the content generated from a model is non-deterministic, prompting to get your desired output is a mix of art and science. However, you can apply techniques and best practices to get good results consistently.

Some prompt engineering techniques work with every model, like using message roles. But different models might need to be prompted differently to produce the best results. Even different snapshots of models within the same family could produce different results. So as you build more complex applications, we strongly recommend:

*   Pinning your production applications to specific [model snapshots](/docs/models) (like `gpt-5-2025-08-07` for example) to ensure consistent behavior
*   Building [evals](/docs/guides/evals) that measure the behavior of your prompts so you can monitor prompt performance as you iterate, or when you change and upgrade model versions

Now, let's examine some tools and techniques available to you to construct prompts.

Message roles and instruction following
---------------------------------------

You can provide instructions to the model with [differing levels of authority](https://model-spec.openai.com/2025-02-12.html#chain_of_command) using the `instructions` API parameter along with **message roles**.

The `instructions` parameter gives the model high-level instructions on how it should behave while generating a response, including tone, goals, and examples of correct responses. Any instructions provided this way will take priority over a prompt in the `input` parameter.

Generate text with instructions

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-5",
    reasoning: { effort: "low" },
    instructions: "Talk like a pirate.",
    input: "Are semicolons optional in JavaScript?",
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    reasoning={"effort": "low"},
    instructions="Talk like a pirate.",
    input="Are semicolons optional in JavaScript?",
)

print(response.output_text)
```

```bash
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-5",
        "reasoning": {"effort": "low"},
        "instructions": "Talk like a pirate.",
        "input": "Are semicolons optional in JavaScript?"
    }'
```

The example above is roughly equivalent to using the following input messages in the `input` array:

Generate text with messages using different roles

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-5",
    reasoning: { effort: "low" },
    input: [
        {
            role: "developer",
            content: "Talk like a pirate."
        },
        {
            role: "user",
            content: "Are semicolons optional in JavaScript?",
        },
    ],
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    reasoning={"effort": "low"},
    input=[
        {
            "role": "developer",
            "content": "Talk like a pirate."
        },
        {
            "role": "user",
            "content": "Are semicolons optional in JavaScript?"
        }
    ]
)

print(response.output_text)
```

```bash
curl "https://api.openai.com/v1/responses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d '{
        "model": "gpt-5",
        "reasoning": {"effort": "low"},
        "input": [
            {
                "role": "developer",
                "content": "Talk like a pirate."
            },
            {
                "role": "user",
                "content": "Are semicolons optional in JavaScript?"
            }
        ]
    }'
```

Note that the `instructions` parameter only applies to the current response generation request. If you are [managing conversation state](/docs/guides/conversation-state) with the `previous_response_id` parameter, the `instructions` used on previous turns will not be present in the context.

The [OpenAI model spec](https://model-spec.openai.com/2025-02-12.html#chain_of_command) describes how our models give different levels of priority to messages with different roles.

|developer|user|assistant|
|---|---|---|
|developer messages are instructions provided by the application developer, prioritized ahead of user messages.|user messages are instructions provided by an end user, prioritized behind developer messages.|Messages generated by the model have the assistant role.|

A multi-turn conversation may consist of several messages of these types, along with other content types provided by both you and the model. Learn more about [managing conversation state here](/docs/guides/conversation-state).

You could think about `developer` and `user` messages like a function and its arguments in a programming language.

*   `developer` messages provide the system's rules and business logic, like a function definition.
*   `user` messages provide inputs and configuration to which the `developer` message instructions are applied, like arguments to a function.

Reusable prompts
----------------

In the OpenAI dashboard, you can develop reusable [prompts](/chat/edit) that you can use in API requests, rather than specifying the content of prompts in code. This way, you can more easily build and evaluate your prompts, and deploy improved versions of your prompts without changing your integration code.

Here's how it works:

1.  **Create a reusable prompt** in the [dashboard](/chat/edit) with placeholders like `{{customer_name}}`.
2.  **Use the prompt** in your API request with the `prompt` parameter. The prompt parameter object has three properties you can configure:
    *   `id` — Unique identifier of your prompt, found in the dashboard
    *   `version` — A specific version of your prompt (defaults to the "current" version as specified in the dashboard)
    *   `variables` — A map of values to substitute in for variables in your prompt. The substitution values can either be strings, or other Response input message types like `input_image` or `input_file`. [See the full API reference](/docs/api-reference/responses/create).

String variables

Generate text with a prompt template

```javascript
import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-5",
    prompt: {
        id: "pmpt_abc123",
        version: "2",
        variables: {
            customer_name: "Jane Doe",
            product: "40oz juice box"
        }
    }
});

console.log(response.output_text);
```

```python
from openai import OpenAI
client = OpenAI()

response = client.responses.create(
    model="gpt-5",
    prompt={
        "id": "pmpt_abc123",
        "version": "2",
        "variables": {
            "customer_name": "Jane Doe",
            "product": "40oz juice box"
        }
    }
)

print(response.output_text)
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "prompt": {
      "id": "pmpt_abc123",
      "version": "2",
      "variables": {
        "customer_name": "Jane Doe",
        "product": "40oz juice box"
      }
    }
  }'
```

Variables with file input

Prompt template with file input variable

```javascript
import fs from "fs";
import OpenAI from "openai";
const client = new OpenAI();

// Upload a PDF we will reference in the prompt variables
const file = await client.files.create({
    file: fs.createReadStream("draconomicon.pdf"),
    purpose: "user_data",
});

const response = await client.responses.create({
    model: "gpt-5",
    prompt: {
        id: "pmpt_abc123",
        variables: {
            topic: "Dragons",
            reference_pdf: {
                type: "input_file",
                file_id: file.id,
            },
        },
    },
});

console.log(response.output_text);
```

```python
import openai, pathlib

client = openai.OpenAI()

# Upload a PDF we will reference in the variables
file = client.files.create(
    file=open("draconomicon.pdf", "rb"),
    purpose="user_data",
)

response = client.responses.create(
    model="gpt-5",
    prompt={
        "id": "pmpt_abc123",
        "variables": {
            "topic": "Dragons",
            "reference_pdf": {
                "type": "input_file",
                "file_id": file.id,
            },
        },
    },
)

print(response.output_text)
```

```bash
# Assume you have already uploaded the PDF and obtained FILE_ID
curl https://api.openai.com/v1/responses   -H "Authorization: Bearer $OPENAI_API_KEY"   -H "Content-Type: application/json"   -d '{
    "model": "gpt-5",
    "prompt": {
      "id": "pmpt_abc123",
      "variables": {
        "topic": "Dragons",
        "reference_pdf": {
          "type": "input_file",
          "file_id": "file-abc123"
        }
      }
    }
  }'
```

Next steps
----------

Now that you known the basics of text inputs and outputs, you might want to check out one of these resources next.

[

Build a prompt in the Playground

Use the Playground to develop and iterate on prompts.

](/chat/edit)[

Generate JSON data with Structured Outputs

Ensure JSON data emitted from a model conforms to a JSON schema.

](/docs/guides/structured-outputs)[

Full API reference

Check out all the options for text generation in the API reference.

](/docs/api-reference/responses)

]

---

## Implementation Learnings (Many Futures Project)

### Critical API Parameter Distinction
Through debugging the Many Futures conversational UI, we discovered a critical distinction in the GPT-5 Responses API parameters:

1. **`input` parameter** - Must contain the actual conversation/messages
   - Can be a string: `input: "simple text"`
   - Can be an array: `input: [{role: "user", content: "text"}]`
   - This is what the model responds to

2. **`instructions` parameter** - Contains meta-guidance/templates
   - System prompts go here
   - Brief generation templates go here
   - This guides HOW the model responds

### Common Error and Fix
**Error:** `"One of 'input' or 'previous_response_id' or 'prompt' must be provided"`

**Cause:** The `input` parameter is undefined, empty, or null

**Fix:** Ensure you're passing the conversation to `input`, not the template:
```javascript
// WRONG - causes error
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: briefTemplate  // This is instructions, not input!
});

// CORRECT
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: conversationMessages,     // The actual conversation
  instructions: briefTemplate,      // The template/guidance
  reasoning: { effort: 'low' },
  text: { verbosity: 'medium' }
});
```

### Message Format Handling
The Vercel AI SDK sends messages in a `parts` array format:
```javascript
// Message from Vercel AI SDK
{
  role: 'user',
  parts: [
    { type: 'text', text: 'Hello' }
  ]
}

// Extract content helper
function extractMessageContent(msg) {
  if (typeof msg.content === 'string') return msg.content;
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');
  }
  return msg.content || '';
}
```

### Conversation State Management
The `previous_response_id` parameter maintains conversation context:
```javascript
// First response
const response1 = await openai.responses.create({
  model: 'gpt-5-mini',
  input: 'Tell me about space',
  instructions: systemPrompt
});

// Continue conversation
const response2 = await openai.responses.create({
  model: 'gpt-5-mini',
  input: 'What about Mars specifically?',
  instructions: systemPrompt,
  previous_response_id: response1.id  // Links to previous turn
});
```

### Response Structure
GPT-5 responses include:
- `output_text` - The generated text response
- `id` - Use for `previous_response_id` in next turn
- `status` - "completed" or "failed"
- `token_usage` - Input/output token counts

### Best Practices
1. Always validate `input` is not empty before API calls
2. Use `instructions` for system prompts and templates
3. Extract message content consistently across different formats
4. Filter special signals (like BRIEF_GENERATION) from user display
5. Implement fallback to GPT-4o-mini when GPT-5 is unavailable
6. Use array format for multi-turn conversations in `input`