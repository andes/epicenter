#include "nssm.h"

/* Copy an environment block. */
TCHAR *copy_environment_block(TCHAR *env) ***REMOVED***
  unsigned long len;

  if (! env) return 0;
  for (len = 0; env[len]; len++) while (env[len]) len++;
  if (! len++) return 0;

  TCHAR *newenv = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, len * sizeof(TCHAR));
  if (! newenv) ***REMOVED***
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_OUT_OF_MEMORY, _T("environment"), _T("copy_environment_block()"), 0);
    return 0;
  ***REMOVED***

  memmove(newenv, env, len * sizeof(TCHAR));
  return newenv;
***REMOVED***

/*
  The environment block starts with variables of the form
  =C:=C:\Windows\System32 which we ignore.
*/
TCHAR *useful_environment(TCHAR *rawenv) ***REMOVED***
  TCHAR *env = rawenv;

  if (env) ***REMOVED***
    while (*env == _T('=')) ***REMOVED***
      for ( ; *env; env++);
      env++;
***REMOVED***
  ***REMOVED***

  return env;
***REMOVED***

/* Expand an environment variable.  Must call HeapFree() on the result. */
TCHAR *expand_environment_string(TCHAR *string) ***REMOVED***
  unsigned long len;

  len = ExpandEnvironmentStrings(string, 0, 0);
  if (! len) ***REMOVED***
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_EXPANDENVIRONMENTSTRINGS_FAILED, string, error_string(GetLastError()), 0);
    return 0;
  ***REMOVED***

  TCHAR *ret = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, len * sizeof(TCHAR));
  if (! ret) ***REMOVED***
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_OUT_OF_MEMORY, _T("ExpandEnvironmentStrings()"), _T("expand_environment_string"), 0);
    return 0;
  ***REMOVED***

  if (! ExpandEnvironmentStrings(string, ret, len)) ***REMOVED***
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_EXPANDENVIRONMENTSTRINGS_FAILED, string, error_string(GetLastError()), 0);
    HeapFree(GetProcessHeap(), 0, ret);
    return 0;
  ***REMOVED***

  return ret;
***REMOVED***

/*
  Set all the environment variables from an environment block in the current
  environment or remove all the variables in the block from the current
  environment.
*/
static int set_environment_block(TCHAR *env, bool set) ***REMOVED***
  int ret = 0;

  TCHAR *s, *t;
  for (s = env; *s; s++) ***REMOVED***
    for (t = s; *t && *t != _T('='); t++);
    if (*t == _T('=')) ***REMOVED***
      *t = _T('\0');
      if (set) ***REMOVED***
        TCHAR *expanded = expand_environment_string(++t);
        if (expanded) ***REMOVED***
          if (! SetEnvironmentVariable(s, expanded)) ret++;
          HeapFree(GetProcessHeap(), 0, expanded);
    ***REMOVED***
        else ***REMOVED***
          if (! SetEnvironmentVariable(s, t)) ret++;
    ***REMOVED***
  ***REMOVED***
      else ***REMOVED***
        if (! SetEnvironmentVariable(s, NULL)) ret++;
  ***REMOVED***
      for (t++ ; *t; t++);
***REMOVED***
    s = t;
  ***REMOVED***

  return ret;
***REMOVED***

int set_environment_block(TCHAR *env) ***REMOVED***
  return set_environment_block(env, true);
***REMOVED***

static int unset_environment_block(TCHAR *env) ***REMOVED***
  return set_environment_block(env, false);
***REMOVED***

/* Remove all variables from the process environment. */
int clear_environment() ***REMOVED***
  TCHAR *rawenv = GetEnvironmentStrings();
  TCHAR *env = useful_environment(rawenv);

  int ret = unset_environment_block(env);

  if (rawenv) FreeEnvironmentStrings(rawenv);

  return ret;
***REMOVED***

/* Set the current environment to exactly duplicate an environment block. */
int duplicate_environment(TCHAR *rawenv) ***REMOVED***
  int ret = clear_environment();
  TCHAR *env = useful_environment(rawenv);
  ret += set_environment_block(env);
  return ret;
***REMOVED***

/*
  Verify an environment block.
  Returns:  1 if environment is invalid.
            0 if environment is OK.
           -1 on error.
*/
int test_environment(TCHAR *env) ***REMOVED***
  TCHAR path[PATH_LENGTH];
  GetModuleFileName(0, path, _countof(path));
  STARTUPINFO si;
  ZeroMemory(&si, sizeof(si));
  si.cb = sizeof(si);
  PROCESS_INFORMATION pi;
  ZeroMemory(&pi, sizeof(pi));
  unsigned long flags = CREATE_SUSPENDED;
#ifdef UNICODE
  flags |= CREATE_UNICODE_ENVIRONMENT;
#endif

  /*
    Try to relaunch ourselves but with the candidate environment set.
    Assuming no solar flare activity, the only reason this would fail is if
    the environment were invalid.
  */
  if (CreateProcess(0, path, 0, 0, 0, flags, env, 0, &si, &pi)) ***REMOVED***
    TerminateProcess(pi.hProcess, 0);
  ***REMOVED***
  else ***REMOVED***
    unsigned long error = GetLastError();
    if (error == ERROR_INVALID_PARAMETER) return 1;
    else return -1;
  ***REMOVED***

  return 0;
***REMOVED***

/*
  Duplicate an environment block returned by GetEnvironmentStrings().
  Since such a block is by definition readonly, and duplicate_environment()
  modifies its inputs, this function takes a copy of the input and operates
  on that.
*/
void duplicate_environment_strings(TCHAR *env) ***REMOVED***
  TCHAR *newenv = copy_environment_block(env);
  if (! newenv) return;

  duplicate_environment(newenv);
  HeapFree(GetProcessHeap(), 0, newenv);
***REMOVED***
