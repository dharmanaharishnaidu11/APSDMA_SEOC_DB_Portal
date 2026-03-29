# SEOC Portal Deployment Guide

## Step 1: Install Survey123 Connect
Download from https://survey123.arcgis.com (Windows desktop app)

## Step 2: Publish Forms
1. Open Survey123 Connect
2. Sign In -> Portal URL: https://apsdmagis.ap.gov.in/gisportal
3. New Survey -> File -> select XLSForm from Survey123_Forms/
4. Preview -> Publish
5. Repeat for each form

## Step 3: Create Portal Users
Portal -> Organization -> Members -> Add Members:
- 2 Admins (Administrator / Creator)
- 1 SEOC Incharge (Publisher / Creator)
- 2 Duty Officers (Publisher / Creator)
- 5 DEOs (User / Field Worker)

## Step 4: Create Groups & Share
- SEOC_Admins group -> share all forms
- SEOC_DutyOfficers group -> share all forms
- SEOC_DEOs group -> share data entry forms

## Step 5: DEO Workflow
1. Open https://apsdmagis.ap.gov.in/gisportal/apps/survey123/
2. Login -> Select form -> Fill data -> Upload PDF -> Submit

## Step 6: Duty Officer Approval
1. Login -> Survey123 Data tab -> Review pending entries -> Approve

## Step 7: Admin - Managing Dropdowns
1. Open Survey123 Connect -> Open survey -> XLSForm
2. Edit choices sheet (add/delete rows)
3. Save -> Publish -> Update
