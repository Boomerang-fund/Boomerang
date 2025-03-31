# Boomerang

ASSIGNED TASKS
Multilanguage - Assigned To: Kevin
    Priority: Critical
    Roles: Developer
    Task: Make multilanguage functionality. This includes static text and dynamic text (user input)
    Progress: Dynamic text works and propagates to the website. i18next will be implemented for static text


REMAINING TASKS
Explore Page
    Priority: Critical
    Roles: Frontend Design, Developer
    Task: 
        Design a page where users can explore/scroll projects to find projects that they like w/out searching for them.
        Implement a continuous scroll that loads additional project as the user scrolls along the page
        Implement position saving so that when users click into a project and then go back, they are in the same feed

Forgot Password Ability - Assigned To:
    Priority: High
    Roles: Developer
    Task: Allow users to reset their password securely

Cookies
    Priority: High
    Roles: Developer, Legal
    Task:
        Apparently location can be classified as an essential cookie (no need to ask for permission). Have legal check that
        If so, get the location of the user and see if their location requires strict cookies or looser cookies. 

New Project "Your Location:
    Priority: Low
    Roles: Developer
    Task: If location is a cookie that we have, add an option for "your location" to the new project location dropdown

DEBUGS/SMALL FIXES
Form Creation Incomplete Data
    Roles: Developer
    Task: When a project is submitted w/ incomplete info there is a pop up at the top that reminds the user to fill in everything. We should direct the user to the project data that is missing.

Location Dropdown Takes a While to Load
    Roles: Developer
    Task: 
        It seems that the location dropdown takes a few seconds to load/connect to the mapbox server
        Maybe move title and description to first step and location to second, then preload the dropdown while the user is filling in step 1.
        Also change the error message that the dropdown shows when it is still connecting to the mapbox server