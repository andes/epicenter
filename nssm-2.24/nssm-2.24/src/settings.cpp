#include "nssm.h"
/* XXX: (value && value->string) is probably bogus because value is probably never null */

/* Affinity. */
#define NSSM_AFFINITY_ALL _T("All")

extern const TCHAR *exit_action_strings[];
extern const TCHAR *startup_strings[];
extern const TCHAR *priority_strings[];

/* Does the parameter refer to the default value of the setting? */
static inline int is_default(const TCHAR *value) ***REMOVED***
  return (str_equiv(value, _T("default")) || str_equiv(value, _T("*")) || ! value[0]);
***REMOVED***

static int value_from_string(const TCHAR *name, value_t *value, const TCHAR *string) ***REMOVED***
  size_t len = _tcslen(string);
  if (! len++) ***REMOVED***
    value->string = 0;
    return 0;
  ***REMOVED***

  value->string = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, len * sizeof(TCHAR));
  if (! value->string) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, name, _T("value_from_string()"));
    return -1;
  ***REMOVED***

  if (_sntprintf_s(value->string, len, _TRUNCATE, _T("%s"), string) < 0) ***REMOVED***
    HeapFree(GetProcessHeap(), 0, value->string);
    print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, name, _T("value_from_string()"));
    return -1;
  ***REMOVED***

  return 1;
***REMOVED***

/* Functions to manage NSSM-specific settings in the registry. */
static int setting_set_number(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! key) return -1;

  unsigned long number;
  long error;

  /* Resetting to default? */
  if (! value || ! value->string) ***REMOVED***
    error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***
  if (str_number(value->string, &number)) return -1;

  if (default_value && number == (unsigned long) default_value) ***REMOVED***
    error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***

  if (set_number(key, (TCHAR *) name, number)) return -1;

  return 1;
***REMOVED***

static int setting_get_number(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  return get_number(key, (TCHAR *) name, &value->numeric, false);
***REMOVED***

static int setting_set_string(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! key) return -1;

  long error;

  /* Resetting to default? */
  if (! value || ! value->string) ***REMOVED***
    if (default_value) value->string = (TCHAR *) default_value;
    else ***REMOVED***
      error = RegDeleteValue(key, name);
      if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
      print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
      return -1;
***REMOVED***
  ***REMOVED***
  if (default_value && _tcslen((TCHAR *) default_value) && str_equiv(value->string, (TCHAR *) default_value)) ***REMOVED***
    error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***

  if (set_expand_string(key, (TCHAR *) name, value->string)) return -1;

  return 1;
***REMOVED***

static int setting_get_string(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  TCHAR buffer[VALUE_LENGTH];

  if (get_string(key, (TCHAR *) name, (TCHAR *) buffer, (unsigned long) sizeof(buffer), false, false, false)) return -1;

  return value_from_string(name, value, buffer);
***REMOVED***

static int setting_set_exit_action(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  unsigned long exitcode;
  TCHAR *code;
  TCHAR action_string[ACTION_LEN];

  if (additional) ***REMOVED***
    /* Default action? */
    if (is_default(additional)) code = 0;
    else ***REMOVED***
      if (str_number(additional, &exitcode)) return -1;
      code = (TCHAR *) additional;
***REMOVED***
  ***REMOVED***

  HKEY key = open_registry(service_name, name, KEY_WRITE);
  if (! key) return -1;

  long error;
  int ret = 1;

  /* Resetting to default? */
  if (value && value->string) _sntprintf_s(action_string, _countof(action_string), _TRUNCATE, _T("%s"), value->string);
  else ***REMOVED***
    if (code) ***REMOVED***
      /* Delete explicit action. */
      error = RegDeleteValue(key, code);
      RegCloseKey(key);
      if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
      print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, code, service_name, error_string(error));
      return -1;
***REMOVED***
    else ***REMOVED***
      /* Explicitly keep the default action. */
      if (default_value) _sntprintf_s(action_string, _countof(action_string), _TRUNCATE, _T("%s"), (TCHAR *) default_value);
      ret = 0;
***REMOVED***
  ***REMOVED***

  /* Validate the string. */
  for (int i = 0; exit_action_strings[i]; i++) ***REMOVED***
    if (! _tcsnicmp((const TCHAR *) action_string, exit_action_strings[i], ACTION_LEN)) ***REMOVED***
      if (default_value && str_equiv(action_string, (TCHAR *) default_value)) ret = 0;
      if (RegSetValueEx(key, code, 0, REG_SZ, (const unsigned char *) exit_action_strings[i], (unsigned long) (_tcslen(action_string) + 1) * sizeof(TCHAR)) != ERROR_SUCCESS) ***REMOVED***
        print_message(stderr, NSSM_MESSAGE_SETVALUE_FAILED, code, service_name, error_string(GetLastError()));
        RegCloseKey(key);
        return -1;
  ***REMOVED***

      RegCloseKey(key);
      return ret;
***REMOVED***
  ***REMOVED***

  print_message(stderr, NSSM_MESSAGE_INVALID_EXIT_ACTION, action_string);
  for (int i = 0; exit_action_strings[i]; i++) _ftprintf(stderr, _T("%s\n"), exit_action_strings[i]);

  return -1;
***REMOVED***

static int setting_get_exit_action(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  unsigned long exitcode = 0;
  unsigned long *code = 0;

  if (additional) ***REMOVED***
    if (! is_default(additional)) ***REMOVED***
      if (str_number(additional, &exitcode)) return -1;
      code = &exitcode;
***REMOVED***
  ***REMOVED***

  TCHAR action_string[ACTION_LEN];
  bool default_action;
  if (get_exit_action(service_name, code, action_string, &default_action)) return -1;

  value_from_string(name, value, action_string);

  if (default_action && ! _tcsnicmp((const TCHAR *) action_string, (TCHAR *) default_value, ACTION_LEN)) return 0;
  return 1;
***REMOVED***

static int setting_set_affinity(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! key) return -1;

  long error;
  __int64 mask;
  __int64 system_affinity = 0LL;

  if (value && value->string) ***REMOVED***
    DWORD_PTR affinity;
    if (! GetProcessAffinityMask(GetCurrentProcess(), &affinity, (DWORD_PTR *) &system_affinity)) system_affinity = ~0;

    if (is_default(value->string) || str_equiv(value->string, NSSM_AFFINITY_ALL)) mask = 0LL;
    else if (affinity_string_to_mask(value->string, &mask)) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_BOGUS_AFFINITY_MASK, value->string, num_cpus() - 1);
      return -1;
***REMOVED***
  ***REMOVED***
  else mask = 0LL;

  if (! mask) ***REMOVED***
    error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***

  /* Canonicalise. */
  TCHAR *canon = 0;
  if (affinity_mask_to_string(mask, &canon)) canon = value->string;

  __int64 effective_affinity = mask & system_affinity;
  if (effective_affinity != mask) ***REMOVED***
    /* Requested CPUs did not intersect with available CPUs? */
    if (! effective_affinity) mask = effective_affinity = system_affinity;

    TCHAR *system = 0;
    if (! affinity_mask_to_string(system_affinity, &system)) ***REMOVED***
      TCHAR *effective = 0;
      if (! affinity_mask_to_string(effective_affinity, &effective)) ***REMOVED***
        print_message(stderr, NSSM_MESSAGE_EFFECTIVE_AFFINITY_MASK, value->string, system, effective);
        HeapFree(GetProcessHeap(), 0, effective);
  ***REMOVED***
      HeapFree(GetProcessHeap(), 0, system);
***REMOVED***
  ***REMOVED***

  if (RegSetValueEx(key, name, 0, REG_SZ, (const unsigned char *) canon, (unsigned long) (_tcslen(canon) + 1) * sizeof(TCHAR)) != ERROR_SUCCESS) ***REMOVED***
    if (canon != value->string) HeapFree(GetProcessHeap(), 0, canon);
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_SETVALUE_FAILED, name, error_string(GetLastError()), 0);
    return -1;
  ***REMOVED***

  if (canon != value->string) HeapFree(GetProcessHeap(), 0, canon);
  return 1;
***REMOVED***

static int setting_get_affinity(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! key) return -1;

  unsigned long type;
  TCHAR *buffer = 0;
  unsigned long buflen = 0;

  int ret = RegQueryValueEx(key, name, 0, &type, 0, &buflen);
  if (ret == ERROR_FILE_NOT_FOUND) ***REMOVED***
    if (value_from_string(name, value, NSSM_AFFINITY_ALL) == 1) return 0;
    return -1;
  ***REMOVED***
  if (ret != ERROR_SUCCESS) return -1;

  if (type != REG_SZ) return -1;

  buffer = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, buflen);
  if (! buffer) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, _T("affinity"), _T("setting_get_affinity"));
    return -1;
  ***REMOVED***

  if (get_string(key, (TCHAR *) name, buffer, buflen, false, false, true)) ***REMOVED***
    HeapFree(GetProcessHeap(), 0, buffer);
    return -1;
  ***REMOVED***

  __int64 affinity;
  if (affinity_string_to_mask(buffer, &affinity)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_BOGUS_AFFINITY_MASK, buffer, num_cpus() - 1);
    HeapFree(GetProcessHeap(), 0, buffer);
    return -1;
  ***REMOVED***

  HeapFree(GetProcessHeap(), 0, buffer);

  /* Canonicalise. */
  if (affinity_mask_to_string(affinity, &buffer)) ***REMOVED***
    if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
    return -1;
  ***REMOVED***

  ret = value_from_string(name, value, buffer);
  HeapFree(GetProcessHeap(), 0, buffer);
  return ret;
***REMOVED***

static int setting_set_environment(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! param) return -1;

  if (! value || ! value->string || ! value->string[0]) ***REMOVED***
    long error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***

  unsigned long envlen = (unsigned long) _tcslen(value->string) + 1;
  TCHAR *unformatted = 0;
  unsigned long newlen;
  if (unformat_double_null(value->string, envlen, &unformatted, &newlen)) return -1;

  if (test_environment(unformatted)) ***REMOVED***
    HeapFree(GetProcessHeap(), 0, unformatted);
    print_message(stderr, NSSM_GUI_INVALID_ENVIRONMENT);
    return -1;
  ***REMOVED***

  if (RegSetValueEx(key, name, 0, REG_MULTI_SZ, (const unsigned char *) unformatted, (unsigned long) newlen * sizeof(TCHAR)) != ERROR_SUCCESS) ***REMOVED***
    if (newlen) HeapFree(GetProcessHeap(), 0, unformatted);
    log_event(EVENTLOG_ERROR_TYPE, NSSM_EVENT_SETVALUE_FAILED, NSSM_REG_ENV, error_string(GetLastError()), 0);
    return -1;
  ***REMOVED***

  if (newlen) HeapFree(GetProcessHeap(), 0, unformatted);
  return 1;
***REMOVED***

static int setting_get_environment(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! param) return -1;

  TCHAR *env = 0;
  unsigned long envlen;
  if (get_environment((TCHAR *) service_name, key, (TCHAR *) name, &env, &envlen)) return -1;
  if (! envlen) return 0;

  TCHAR *formatted;
  unsigned long newlen;
  if (format_double_null(env, envlen, &formatted, &newlen)) return -1;

  int ret;
  if (additional) ***REMOVED***
    /* Find named environment variable. */
    TCHAR *s;
    size_t len = _tcslen(additional);
    for (s = env; *s; s++) ***REMOVED***
      /* Look for <additional>=<string> NULL NULL */
      if (! _tcsnicmp(s, additional, len) && s[len] == _T('=')) ***REMOVED***
        /* Strip <key>= */
        s += len + 1;
        ret = value_from_string(name, value, s);
        HeapFree(GetProcessHeap(), 0, env);
        return ret;
  ***REMOVED***

      /* Skip this string. */
      for ( ; *s; s++);
***REMOVED***
    HeapFree(GetProcessHeap(), 0, env);
    return 0;
  ***REMOVED***

  HeapFree(GetProcessHeap(), 0, env);

  ret = value_from_string(name, value, formatted);
  if (newlen) HeapFree(GetProcessHeap(), 0, formatted);
  return ret;
***REMOVED***

static int setting_set_priority(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! param) return -1;

  TCHAR *priority_string;
  int i;
  long error;

  if (value && value->string) priority_string = value->string;
  else if (default_value) priority_string = (TCHAR *) default_value;
  else ***REMOVED***
    error = RegDeleteValue(key, name);
    if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
    print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
    return -1;
  ***REMOVED***

  for (i = 0; priority_strings[i]; i++) ***REMOVED***
    if (! str_equiv(priority_strings[i], priority_string)) continue;

    if (default_value && str_equiv(priority_string, (TCHAR *) default_value)) ***REMOVED***
      error = RegDeleteValue(key, name);
      if (error == ERROR_SUCCESS || error == ERROR_FILE_NOT_FOUND) return 0;
      print_message(stderr, NSSM_MESSAGE_REGDELETEVALUE_FAILED, name, service_name, error_string(error));
      return -1;
***REMOVED***

    if (set_number(key, (TCHAR *) name, priority_index_to_constant(i))) return -1;
    return 1;
  ***REMOVED***

  print_message(stderr, NSSM_MESSAGE_INVALID_PRIORITY, priority_string);
  for (i = 0; priority_strings[i]; i++) _ftprintf(stderr, _T("%s\n"), priority_strings[i]);

  return -1;
***REMOVED***

static int setting_get_priority(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  HKEY key = (HKEY) param;
  if (! param) return -1;

  unsigned long constant;
  switch (get_number(key, (TCHAR *) name, &constant, false)) ***REMOVED***
    case 0: return value_from_string(name, value, (const TCHAR *) default_value);
    case -1: return -1;
  ***REMOVED***

  return value_from_string(name, value, priority_strings[priority_constant_to_index(constant)]);
***REMOVED***

/* Functions to manage native service settings. */
static int native_set_dependongroup(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /*
    Get existing service dependencies because we must set both types together.
  */
  TCHAR *buffer;
  unsigned long buflen;
  if (get_service_dependencies(service_name, service_handle, &buffer, &buflen, DEPENDENCY_SERVICES)) return -1;

  if (! value || ! value->string || ! value->string[0]) ***REMOVED***
    if (! ChangeServiceConfig(service_handle, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, 0, 0, 0, buffer, 0, 0, 0)) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
      if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
    return 0;
  ***REMOVED***

  unsigned long len = (unsigned long) _tcslen(value->string) + 1;
  TCHAR *unformatted = 0;
  unsigned long newlen;
  if (unformat_double_null(value->string, len, &unformatted, &newlen)) ***REMOVED***
    if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
    return -1;
  ***REMOVED***

  /* Prepend group identifier. */
  unsigned long missing = 0;
  TCHAR *canon = unformatted;
  size_t canonlen = 0;
  TCHAR *s;
  for (s = unformatted; *s; s++) ***REMOVED***
    if (*s != SC_GROUP_IDENTIFIER) missing++;
    size_t len = _tcslen(s);
    canonlen += len + 1;
    s += len;
  ***REMOVED***

  if (missing) ***REMOVED***
    /* Missing identifiers plus double NULL terminator. */
    canonlen += missing + 1;
    newlen = (unsigned long) canonlen;

    canon = (TCHAR *) HeapAlloc(GetProcessHeap(), HEAP_ZERO_MEMORY, canonlen * sizeof(TCHAR));
    if (! canon) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, _T("canon"), _T("native_set_dependongroup"));
      if (unformatted) HeapFree(GetProcessHeap(), 0, unformatted);
      if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    size_t i = 0;
    for (s = unformatted; *s; s++) ***REMOVED***
      if (*s != SC_GROUP_IDENTIFIER) canon[i++] = SC_GROUP_IDENTIFIER;
      size_t len = _tcslen(s);
      memmove(canon + i, s, (len + 1) * sizeof(TCHAR));
      i += len + 1;
      s += len;
***REMOVED***
  ***REMOVED***

  TCHAR *dependencies;
  if (buflen > 2) ***REMOVED***
    dependencies = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, (newlen + buflen) * sizeof(TCHAR));
    if (! dependencies) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, _T("dependencies"), _T("native_set_dependongroup"));
      if (canon != unformatted) HeapFree(GetProcessHeap(), 0, canon);
      if (unformatted) HeapFree(GetProcessHeap(), 0, unformatted);
      if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    memmove(dependencies, buffer, buflen * sizeof(TCHAR));
    memmove(dependencies + buflen - 1, canon, newlen * sizeof(TCHAR));
  ***REMOVED***
  else dependencies = canon;

  int ret = 1;
  if (set_service_dependencies(service_name, service_handle, dependencies)) ret = -1;
  if (dependencies != unformatted) HeapFree(GetProcessHeap(), 0, dependencies);
  if (canon != unformatted) HeapFree(GetProcessHeap(), 0, canon);
  if (unformatted) HeapFree(GetProcessHeap(), 0, unformatted);
  if (buffer) HeapFree(GetProcessHeap(), 0, buffer);

  return ret;
***REMOVED***

static int native_get_dependongroup(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  TCHAR *buffer;
  unsigned long buflen;
  if (get_service_dependencies(service_name, service_handle, &buffer, &buflen, DEPENDENCY_GROUPS)) return -1;

  int ret;
  if (buflen) ***REMOVED***
    TCHAR *formatted;
    unsigned long newlen;
    if (format_double_null(buffer, buflen, &formatted, &newlen)) ***REMOVED***
      HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    ret = value_from_string(name, value, formatted);
    HeapFree(GetProcessHeap(), 0, formatted);
    HeapFree(GetProcessHeap(), 0, buffer);
  ***REMOVED***
  else ***REMOVED***
    value->string = 0;
    ret = 0;
  ***REMOVED***

  return ret;
***REMOVED***

static int native_set_dependonservice(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /*
    Get existing group dependencies because we must set both types together.
  */
  TCHAR *buffer;
  unsigned long buflen;
  if (get_service_dependencies(service_name, service_handle, &buffer, &buflen, DEPENDENCY_GROUPS)) return -1;

  if (! value || ! value->string || ! value->string[0]) ***REMOVED***
    if (! ChangeServiceConfig(service_handle, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, 0, 0, 0, buffer, 0, 0, 0)) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
      if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
    return 0;
  ***REMOVED***

  unsigned long len = (unsigned long) _tcslen(value->string) + 1;
  TCHAR *unformatted = 0;
  unsigned long newlen;
  if (unformat_double_null(value->string, len, &unformatted, &newlen)) ***REMOVED***
    if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
    return -1;
  ***REMOVED***

  TCHAR *dependencies;
  if (buflen > 2) ***REMOVED***
    dependencies = (TCHAR *) HeapAlloc(GetProcessHeap(), 0, (newlen + buflen) * sizeof(TCHAR));
    if (! dependencies) ***REMOVED***
      print_message(stderr, NSSM_MESSAGE_OUT_OF_MEMORY, _T("dependencies"), _T("native_set_dependonservice"));
      if (unformatted) HeapFree(GetProcessHeap(), 0, unformatted);
      if (buffer) HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    memmove(dependencies, buffer, buflen * sizeof(TCHAR));
    memmove(dependencies + buflen - 1, unformatted, newlen * sizeof(TCHAR));
  ***REMOVED***
  else dependencies = unformatted;

  int ret = 1;
  if (set_service_dependencies(service_name, service_handle, dependencies)) ret = -1;
  if (dependencies != unformatted) HeapFree(GetProcessHeap(), 0, dependencies);
  if (unformatted) HeapFree(GetProcessHeap(), 0, unformatted);
  if (buffer) HeapFree(GetProcessHeap(), 0, buffer);

  return ret;
***REMOVED***

static int native_get_dependonservice(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  TCHAR *buffer;
  unsigned long buflen;
  if (get_service_dependencies(service_name, service_handle, &buffer, &buflen, DEPENDENCY_SERVICES)) return -1;

  int ret;
  if (buflen) ***REMOVED***
    TCHAR *formatted;
    unsigned long newlen;
    if (format_double_null(buffer, buflen, &formatted, &newlen)) ***REMOVED***
      HeapFree(GetProcessHeap(), 0, buffer);
      return -1;
***REMOVED***

    ret = value_from_string(name, value, formatted);
    HeapFree(GetProcessHeap(), 0, formatted);
    HeapFree(GetProcessHeap(), 0, buffer);
  ***REMOVED***
  else ***REMOVED***
    value->string = 0;
    ret = 0;
  ***REMOVED***

  return ret;
***REMOVED***

int native_set_description(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  TCHAR *description = 0;
  if (value) description = value->string;
  if (set_service_description(service_name, service_handle, description)) return -1;

  if (description && description[0]) return 1;

  return 0;
***REMOVED***

int native_get_description(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  TCHAR buffer[VALUE_LENGTH];
  if (get_service_description(service_name, service_handle, _countof(buffer), buffer)) return -1;

  if (buffer[0]) return value_from_string(name, value, buffer);
  value->string = 0;

  return 0;
***REMOVED***

int native_set_displayname(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  TCHAR *displayname = 0;
  if (value && value->string) displayname = value->string;
  else displayname = (TCHAR *) service_name;

  if (! ChangeServiceConfig(service_handle, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, 0, 0, 0, 0, 0, 0, displayname)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
    return -1;
  ***REMOVED***

  /*
    If the display name and service name differ only in case,
    ChangeServiceConfig() will return success but the display name will be
    set to the service name, NOT the value passed to the function.
    This appears to be a quirk of Windows rather than a bug here.
  */
  if (displayname != service_name && ! str_equiv(displayname, service_name)) return 1;

  return 0;
***REMOVED***

int native_get_displayname(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
  if (! qsc) return -1;

  int ret = value_from_string(name, value, qsc->lpDisplayName);
  HeapFree(GetProcessHeap(), 0, qsc);

  return ret;
***REMOVED***

int native_set_imagepath(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /* It makes no sense to try to reset the image path. */
  if (! value || ! value->string) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_NO_DEFAULT_VALUE, name);
    return -1;
  ***REMOVED***

  if (! ChangeServiceConfig(service_handle, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, value->string, 0, 0, 0, 0, 0, 0)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
    return -1;
  ***REMOVED***

  return 1;
***REMOVED***

int native_get_imagepath(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
  if (! qsc) return -1;

  int ret = value_from_string(name, value, qsc->lpBinaryPathName);
  HeapFree(GetProcessHeap(), 0, qsc);

  return ret;
***REMOVED***

int native_set_name(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  print_message(stderr, NSSM_MESSAGE_CANNOT_RENAME_SERVICE);
  return -1;
***REMOVED***

int native_get_name(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  return value_from_string(name, value, service_name);
***REMOVED***

int native_set_objectname(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /*
    Logical syntax is: nssm set <service> ObjectName <username> <password>
    That means the username is actually passed in the additional parameter.
  */
  bool localsystem = false;
  TCHAR *username = NSSM_LOCALSYSTEM_ACCOUNT;
  TCHAR *password = 0;
  if (additional) ***REMOVED***
    username = (TCHAR *) additional;
    if (value && value->string) password = value->string;
  ***REMOVED***
  else if (value && value->string) username = value->string;

  const TCHAR *well_known = well_known_username(username);
  size_t passwordsize = 0;
  if (well_known) ***REMOVED***
    if (str_equiv(well_known, NSSM_LOCALSYSTEM_ACCOUNT)) localsystem = true;
    username = (TCHAR *) well_known;
    password = _T("");
  ***REMOVED***
  else if (! password) ***REMOVED***
    /* We need a password if the account requires it. */
    print_message(stderr, NSSM_MESSAGE_MISSING_PASSWORD, name);
    return -1;
  ***REMOVED***
  else passwordsize = _tcslen(password) * sizeof(TCHAR);

  /*
    ChangeServiceConfig() will fail to set the username if the service is set
    to interact with the desktop.
  */
  unsigned long type = SERVICE_NO_CHANGE;
  if (! localsystem) ***REMOVED***
    QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
    if (! qsc) ***REMOVED***
      if (passwordsize) SecureZeroMemory(password, passwordsize);
      return -1;
***REMOVED***

    type = qsc->dwServiceType & ~SERVICE_INTERACTIVE_PROCESS;
    HeapFree(GetProcessHeap(), 0, qsc);
  ***REMOVED***

  if (! well_known) ***REMOVED***
    if (grant_logon_as_service(username)) ***REMOVED***
      if (passwordsize) SecureZeroMemory(password, passwordsize);
      print_message(stderr, NSSM_MESSAGE_GRANT_LOGON_AS_SERVICE_FAILED, username);
      return -1;
***REMOVED***
  ***REMOVED***

  if (! ChangeServiceConfig(service_handle, type, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, 0, 0, 0, 0, username, password, 0)) ***REMOVED***
    if (passwordsize) SecureZeroMemory(password, passwordsize);
    print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
    return -1;
  ***REMOVED***

  if (passwordsize) SecureZeroMemory(password, passwordsize);

  if (localsystem) return 0;

  return 1;
***REMOVED***

int native_get_objectname(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
  if (! qsc) return -1;

  int ret = value_from_string(name, value, qsc->lpServiceStartName);
  HeapFree(GetProcessHeap(), 0, qsc);

  return ret;
***REMOVED***

int native_set_startup(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /* It makes no sense to try to reset the startup type. */
  if (! value || ! value->string) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_NO_DEFAULT_VALUE, name);
    return -1;
  ***REMOVED***

  /* Map NSSM_STARTUP_* constant to Windows SERVICE_*_START constant. */
  int service_startup = -1;
  int i;
  for (i = 0; startup_strings[i]; i++) ***REMOVED***
    if (str_equiv(value->string, startup_strings[i])) ***REMOVED***
      service_startup = i;
      break;
***REMOVED***
  ***REMOVED***

  if (service_startup < 0) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_INVALID_SERVICE_STARTUP, value->string);
    for (i = 0; startup_strings[i]; i++) _ftprintf(stderr, _T("%s\n"), startup_strings[i]);
    return -1;
  ***REMOVED***

  unsigned long startup;
  switch (service_startup) ***REMOVED***
    case NSSM_STARTUP_MANUAL: startup = SERVICE_DEMAND_START; break;
    case NSSM_STARTUP_DISABLED: startup = SERVICE_DISABLED; break;
    default: startup = SERVICE_AUTO_START;
  ***REMOVED***

  if (! ChangeServiceConfig(service_handle, SERVICE_NO_CHANGE, startup, SERVICE_NO_CHANGE, 0, 0, 0, 0, 0, 0, 0)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
    return -1;
  ***REMOVED***

  SERVICE_DELAYED_AUTO_START_INFO delayed;
  ZeroMemory(&delayed, sizeof(delayed));
  if (service_startup == NSSM_STARTUP_DELAYED) delayed.fDelayedAutostart = 1;
  else delayed.fDelayedAutostart = 0;
  if (! ChangeServiceConfig2(service_handle, SERVICE_CONFIG_DELAYED_AUTO_START_INFO, &delayed)) ***REMOVED***
    unsigned long error = GetLastError();
    /* Pre-Vista we expect to fail with ERROR_INVALID_LEVEL */
    if (error != ERROR_INVALID_LEVEL) ***REMOVED***
      log_event(EVENTLOG_ERROR_TYPE, NSSM_MESSAGE_SERVICE_CONFIG_DELAYED_AUTO_START_INFO_FAILED, service_name, error_string(error), 0);
***REMOVED***
  ***REMOVED***

  return 1;
***REMOVED***

int native_get_startup(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
  if (! qsc) return -1;

  unsigned long startup;
  int ret = get_service_startup(service_name, service_handle, qsc, &startup);
  HeapFree(GetProcessHeap(), 0, qsc);

  if (ret) return -1;

  unsigned long i;
  for (i = 0; startup_strings[i]; i++);
  if (startup >= i) return -1;

  return value_from_string(name, value, startup_strings[startup]);
***REMOVED***

int native_set_type(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  /* It makes no sense to try to reset the service type. */
  if (! value || ! value->string) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_NO_DEFAULT_VALUE, name);
    return -1;
  ***REMOVED***

  /*
    We can only manage services of type SERVICE_WIN32_OWN_PROCESS
    and SERVICE_INTERACTIVE_PROCESS.
  */
  unsigned long type = SERVICE_WIN32_OWN_PROCESS;
  if (str_equiv(value->string, NSSM_INTERACTIVE_PROCESS)) type |= SERVICE_INTERACTIVE_PROCESS;
  else if (! str_equiv(value->string, NSSM_WIN32_OWN_PROCESS)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_INVALID_SERVICE_TYPE, value->string);
    _ftprintf(stderr, _T("%s\n"), NSSM_WIN32_OWN_PROCESS);
    _ftprintf(stderr, _T("%s\n"), NSSM_INTERACTIVE_PROCESS);
    return -1;
  ***REMOVED***

  /*
    ChangeServiceConfig() will fail if the service runs under an account
    other than LOCALSYSTEM and we try to make it interactive.
  */
  if (type & SERVICE_INTERACTIVE_PROCESS) ***REMOVED***
    QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
    if (! qsc) return -1;

    if (! str_equiv(qsc->lpServiceStartName, NSSM_LOCALSYSTEM_ACCOUNT)) ***REMOVED***
      HeapFree(GetProcessHeap(), 0, qsc);
      print_message(stderr, NSSM_MESSAGE_INTERACTIVE_NOT_LOCALSYSTEM, value->string, service_name, NSSM_LOCALSYSTEM_ACCOUNT);
      return -1;
***REMOVED***

    HeapFree(GetProcessHeap(), 0, qsc);
  ***REMOVED***

  if (! ChangeServiceConfig(service_handle, type, SERVICE_NO_CHANGE, SERVICE_NO_CHANGE, 0, 0, 0, 0, 0, 0, 0)) ***REMOVED***
    print_message(stderr, NSSM_MESSAGE_CHANGESERVICECONFIG_FAILED, error_string(GetLastError()));
    return -1;
  ***REMOVED***

  return 1;
***REMOVED***

int native_get_type(const TCHAR *service_name, void *param, const TCHAR *name, void *default_value, value_t *value, const TCHAR *additional) ***REMOVED***
  SC_HANDLE service_handle = (SC_HANDLE) param;
  if (! service_handle) return -1;

  QUERY_SERVICE_CONFIG *qsc = query_service_config(service_name, service_handle);
  if (! qsc) return -1;

  value->numeric = qsc->dwServiceType;
  HeapFree(GetProcessHeap(), 0, qsc);

  const TCHAR *string;
  switch (value->numeric) ***REMOVED***
    case SERVICE_KERNEL_DRIVER: string = NSSM_KERNEL_DRIVER; break;
    case SERVICE_FILE_SYSTEM_DRIVER: string = NSSM_FILE_SYSTEM_DRIVER; break;
    case SERVICE_WIN32_OWN_PROCESS: string = NSSM_WIN32_OWN_PROCESS; break;
    case SERVICE_WIN32_SHARE_PROCESS: string = NSSM_WIN32_SHARE_PROCESS; break;
    case SERVICE_WIN32_OWN_PROCESS|SERVICE_INTERACTIVE_PROCESS: string = NSSM_INTERACTIVE_PROCESS; break;
    case SERVICE_WIN32_SHARE_PROCESS|SERVICE_INTERACTIVE_PROCESS: string = NSSM_SHARE_INTERACTIVE_PROCESS; break;
    default: string = NSSM_UNKNOWN;
  ***REMOVED***

  return value_from_string(name, value, string);
***REMOVED***

int set_setting(const TCHAR *service_name, HKEY key, settings_t *setting, value_t *value, const TCHAR *additional) ***REMOVED***
  if (! key) return -1;
  int ret;

  if (setting->set) ret = setting->set(service_name, (void *) key, setting->name, setting->default_value, value, additional);
  else ret = -1;

  if (! ret) print_message(stdout, NSSM_MESSAGE_RESET_SETTING, setting->name, service_name);
  else if (ret > 0) print_message(stdout, NSSM_MESSAGE_SET_SETTING, setting->name, service_name);
  else print_message(stderr, NSSM_MESSAGE_SET_SETTING_FAILED, setting->name, service_name);

  return ret;
***REMOVED***

int set_setting(const TCHAR *service_name, SC_HANDLE service_handle, settings_t *setting, value_t *value, const TCHAR *additional) ***REMOVED***
  if (! service_handle) return -1;

  int ret;
  if (setting->set) ret = setting->set(service_name, service_handle, setting->name, setting->default_value, value, additional);
  else ret = -1;

  if (! ret) print_message(stdout, NSSM_MESSAGE_RESET_SETTING, setting->name, service_name);
  else if (ret > 0) print_message(stdout, NSSM_MESSAGE_SET_SETTING, setting->name, service_name);
  else print_message(stderr, NSSM_MESSAGE_SET_SETTING_FAILED, setting->name, service_name);

  return ret;
***REMOVED***

/*
  Returns:  1 if the value was retrieved.
            0 if the default value was retrieved.
           -1 on error.
*/
int get_setting(const TCHAR *service_name, HKEY key, settings_t *setting, value_t *value, const TCHAR *additional) ***REMOVED***
  if (! key) return -1;
  int ret;

  switch (setting->type) ***REMOVED***
    case REG_EXPAND_SZ:
    case REG_MULTI_SZ:
    case REG_SZ:
      value->string = (TCHAR *) setting->default_value;
      if (setting->get) ret = setting->get(service_name, (void *) key, setting->name, setting->default_value, value, additional);
      else ret = -1;
      break;

    case REG_DWORD:
      value->numeric = (unsigned long) setting->default_value;
      if (setting->get) ret = setting->get(service_name, (void *) key, setting->name, setting->default_value, value, additional);
      else ret = -1;
      break;

    default:
      ret = -1;
      break;
  ***REMOVED***

  if (ret < 0) print_message(stderr, NSSM_MESSAGE_GET_SETTING_FAILED, setting->name, service_name);

  return ret;
***REMOVED***

int get_setting(const TCHAR *service_name, SC_HANDLE service_handle, settings_t *setting, value_t *value, const TCHAR *additional) ***REMOVED***
  if (! service_handle) return -1;
  return setting->get(service_name, service_handle, setting->name, 0, value, additional);
***REMOVED***

settings_t settings[] = ***REMOVED***
  ***REMOVED*** NSSM_REG_EXE, REG_EXPAND_SZ, (void *) _T(""), false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_FLAGS, REG_EXPAND_SZ, (void *) _T(""), false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_DIR, REG_EXPAND_SZ, (void *) _T(""), false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_EXIT, REG_SZ, (void *) exit_action_strings[NSSM_EXIT_RESTART], false, ADDITIONAL_MANDATORY, setting_set_exit_action, setting_get_exit_action ***REMOVED***,
  ***REMOVED*** NSSM_REG_AFFINITY, REG_SZ, 0, false, 0, setting_set_affinity, setting_get_affinity ***REMOVED***,
  ***REMOVED*** NSSM_REG_ENV, REG_MULTI_SZ, NULL, false, ADDITIONAL_CRLF, setting_set_environment, setting_get_environment ***REMOVED***,
  ***REMOVED*** NSSM_REG_ENV_EXTRA, REG_MULTI_SZ, NULL, false, ADDITIONAL_CRLF, setting_set_environment, setting_get_environment ***REMOVED***,
  ***REMOVED*** NSSM_REG_NO_CONSOLE, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_PRIORITY, REG_SZ, (void *) priority_strings[NSSM_NORMAL_PRIORITY], false, 0, setting_set_priority, setting_get_priority ***REMOVED***,
  ***REMOVED*** NSSM_REG_RESTART_DELAY, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDIN, REG_EXPAND_SZ, NULL, false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDIN NSSM_REG_STDIO_SHARING, REG_DWORD, (void *) NSSM_STDIN_SHARING, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDIN NSSM_REG_STDIO_DISPOSITION, REG_DWORD, (void *) NSSM_STDIN_DISPOSITION, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDIN NSSM_REG_STDIO_FLAGS, REG_DWORD, (void *) NSSM_STDIN_FLAGS, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDOUT, REG_EXPAND_SZ, NULL, false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDOUT NSSM_REG_STDIO_SHARING, REG_DWORD, (void *) NSSM_STDOUT_SHARING, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDOUT NSSM_REG_STDIO_DISPOSITION, REG_DWORD, (void *) NSSM_STDOUT_DISPOSITION, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDOUT NSSM_REG_STDIO_FLAGS, REG_DWORD, (void *) NSSM_STDOUT_FLAGS, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDERR, REG_EXPAND_SZ, NULL, false, 0, setting_set_string, setting_get_string ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDERR NSSM_REG_STDIO_SHARING, REG_DWORD, (void *) NSSM_STDERR_SHARING, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDERR NSSM_REG_STDIO_DISPOSITION, REG_DWORD, (void *) NSSM_STDERR_DISPOSITION, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STDERR NSSM_REG_STDIO_FLAGS, REG_DWORD, (void *) NSSM_STDERR_FLAGS, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_STOP_METHOD_SKIP, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_KILL_CONSOLE_GRACE_PERIOD, REG_DWORD, (void *) NSSM_KILL_CONSOLE_GRACE_PERIOD, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_KILL_WINDOW_GRACE_PERIOD, REG_DWORD, (void *) NSSM_KILL_WINDOW_GRACE_PERIOD, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_KILL_THREADS_GRACE_PERIOD, REG_DWORD, (void *) NSSM_KILL_THREADS_GRACE_PERIOD, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_THROTTLE, REG_DWORD, (void *) NSSM_RESET_THROTTLE_RESTART, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_ROTATE, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_ROTATE_ONLINE, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_ROTATE_SECONDS, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_ROTATE_BYTES_LOW, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_REG_ROTATE_BYTES_HIGH, REG_DWORD, 0, false, 0, setting_set_number, setting_get_number ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_DEPENDONGROUP, REG_MULTI_SZ, NULL, true, ADDITIONAL_CRLF, native_set_dependongroup, native_get_dependongroup ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_DEPENDONSERVICE, REG_MULTI_SZ, NULL, true, ADDITIONAL_CRLF, native_set_dependonservice, native_get_dependonservice ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_DESCRIPTION, REG_SZ, _T(""), true, 0, native_set_description, native_get_description ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_DISPLAYNAME, REG_SZ, NULL, true, 0, native_set_displayname, native_get_displayname ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_IMAGEPATH, REG_EXPAND_SZ, NULL, true, 0, native_set_imagepath, native_get_imagepath ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_OBJECTNAME, REG_SZ, NSSM_LOCALSYSTEM_ACCOUNT, true, 0, native_set_objectname, native_get_objectname ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_NAME, REG_SZ, NULL, true, 0, native_set_name, native_get_name ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_STARTUP, REG_SZ, NULL, true, 0, native_set_startup, native_get_startup ***REMOVED***,
  ***REMOVED*** NSSM_NATIVE_TYPE, REG_SZ, NULL, true, 0, native_set_type, native_get_type ***REMOVED***,
  ***REMOVED*** NULL, NULL, NULL, NULL, NULL ***REMOVED***
***REMOVED***;
