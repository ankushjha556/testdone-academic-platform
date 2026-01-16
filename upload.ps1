
$pw = 'Maruti)Balaji2024'
echo y | .\pscp.exe -pw $pw frontend/src/app/questions/page.tsx root@72.62.76.73:/home/testdone/testdone/frontend/src/app/questions/page.tsx
echo y | .\pscp.exe -pw $pw backend/src/routes/question.routes.ts root@72.62.76.73:/home/testdone/testdone/backend/src/routes/question.routes.ts
echo y | .\pscp.exe -pw $pw backend/scripts/deduplicate_questions.ts root@72.62.76.73:/home/testdone/testdone/backend/scripts/deduplicate_questions.ts
echo y | .\pscp.exe -pw $pw backend/scripts/fix_question_status.ts root@72.62.76.73:/home/testdone/testdone/backend/scripts/fix_question_status.ts
